require('dotenv').config();

const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const Listr = require('listr');
const { argv } = require('yargs');
const { format: formatDate } = require('date-fns');
const {
  formTrainingDataQueries,
  // addPositiveExamples,
  addNegativeExamples,
  addNonTrainedResults,
  addTrainedResults,
  uploadTrainingData,
  waitForTrainingCompletion,
  addFilters,
  convertEntitiesToCsv,
} = require('../services/training');
const discovery = require('../providers/watson/discovery');
const { saveJsonToTempFile, importJsonFromTempFile, writeTmpFile } = require('../helpers/file');
const logger = require('../helpers/logger');
const { getCurrentDate, getUTCDate, delay } = require('../helpers/misc');
const { services: { watson: { nlu: nluConfig } } } = require('../config');

const ENTITIES_FILENAME = argv.entitiesFilename || 'entities';

const DEFAULT_QUEUE_SIZE = argv.queueSize || 10;
const MAX_ITERATIONS = argv.maxIterations || 1;
const TICKET_LIMIT = argv.ticketLimit || 0;
const REQUEST_TIMEOUT = argv.requestTimeout || 60000;

const QUEUE_SIZE = {
  TRAINING_DATA: argv.trainingDataQueueSize || DEFAULT_QUEUE_SIZE,
  NEGATIVE_EXAMPLES: argv.negativeExamplesQueueSize || DEFAULT_QUEUE_SIZE,
  FILTERS: argv.filtersQueueSize || DEFAULT_QUEUE_SIZE,
  NON_TRAINED: argv.nonTrainedQueueSize || DEFAULT_QUEUE_SIZE,
  UPLOAD: argv.uploadQueueSize || DEFAULT_QUEUE_SIZE,
  TRAINED: argv.trainedQueueSize || DEFAULT_QUEUE_SIZE,
};

const useTranslit = !argv.noTranslit;

// preserve cursor to iterate over new set of Zendesk audits
// every new training iteration
let iteration = argv.iteration || 1;
let currentIteration = 1;
let lastTrainedTime = null;
let firstRun = true;

argv.saveEachStepData = true;

const currentDate = getCurrentDate();

const createStepsDirectory = async () => {
  const stepsRoot = path.resolve(__dirname, '../tmp/steps');

  const formNameAndCreate = async (count = 0) => {
    let pathname = `${stepsRoot}/${currentDate}`;

    if (count) {
      pathname += `-${count}`;
    }

    const exists = await fs.pathExists(pathname);

    if (exists) {
      return formNameAndCreate(++count);
    }

    await fs.ensureDir(pathname);
    return pathname;
  };

  return formNameAndCreate();
};

// TODO: properly get current steps directory if started from further steps
let stepsDirectory;

const loadQueriesFromFile = () => argv.fromFile && firstRun;

if (process.env.NODE_ENV !== 'production') {
  require('longjohn'); // eslint-disable-line
}

const createTasks = () => new Listr([
  {
    title: 'Deleting all training data from collection',
    skip: () => iteration > 1 || !argv.deleteAllTrainingData,
    task: async () => discovery.collections.deleteAllTrainingData(),
  },
  {
    title: 'Forming representative set of training and testing data queries with positive examples',
    skip: () => argv.startFromNegativeExamples || argv.startFromFilters || argv.startFromTrainedEntities,
    task: async ctx => {
      ctx.queries = await formTrainingDataQueries({
        ticketLimit: TICKET_LIMIT,
        useTranslit,
      });

      // if (iteration === 1) {
      //   ctx.queries = {
      //     training,
      //     testing,
      //   };
      // } else {
      //   // for second and subsequent iterations we need
      //   // to change only training set
      //   ctx.queries.training = training;
      // }

      if (argv.saveEachStepData) {
        stepsDirectory = await createStepsDirectory();
        await saveJsonToTempFile(`${stepsDirectory}/01-queriesFromDatabase.json`, ctx.queries);
      }
    },
  },
  // {
  //   title: 'Building training data set with positive examples',
  //   skip: () =>
  //     loadQueriesFromFile() ||
  //     argv.skipPositiveExamples ||
  //     iteration > 1 ||
  //     argv.startFromNegativeExamples ||
  //     argv.startFromFilters ||
  //     argv.startFromTrainedEntities,
  //   task: async (ctx, task) => {
  //     ctx.queries = await addPositiveExamples(ctx.queries, {
  //       queue: QUEUE_SIZE.TRAINING_DATA,
  //       task,
  //       iteration,
  //     });

  //     if (argv.saveEachStepData && !argv.startFromNegativeExamples) {
  //       await saveJsonToTempFile(`${stepsDirectory}/02-queriesWithPositiveExamples.json`, ctx.queries);
  //     }
  //   },
  // },
  {
    title: 'Adding negative examples to training data set',
    skip: () => loadQueriesFromFile() || argv.skipNegativeExamples || argv.startFromTrainedEntities || argv.startFromFilters,
    task: async (ctx, task) => {
      if (argv.startFromNegativeExamples) {
        ctx.queries = await importJsonFromTempFile(`${stepsDirectory}/01-queriesFromDatabase.json`);
      }

      ctx.queries = await addNegativeExamples(ctx.queries, {
        queue: QUEUE_SIZE.NEGATIVE_EXAMPLES,
        task,
      });

      if (argv.saveEachStepData && !argv.startFromFilters) {
        await saveJsonToTempFile(`${stepsDirectory}/02-queriesWithNegativeExamples.json`, ctx.queries);
      }
    },
  },
  {
    title: 'Adding filters to training data set',
    skip: () => loadQueriesFromFile() || argv.startFromTrainedEntities,
    task: async (ctx, task) => {
      if (argv.startFromFilters) {
        ctx.queries = await importJsonFromTempFile(`${stepsDirectory}/02-queriesWithNegativeExamples.json`);
      }

      ctx.queries = await addFilters(ctx.queries, {
        task,
        queue: QUEUE_SIZE.FILTERS,
        nluModelId: nluConfig.modelId,
        iteration,
      });

      if (argv.saveEachStepData) {
        await saveJsonToTempFile(`${stepsDirectory}/03-queriesWithFilters.json`, ctx.queries);
      }

      if (argv.saveQueriesAndExit) {
        throw new Error('Training data is saved and not processed further.');
      }
    },
  },
  {
    title: 'Creating testing wrappers for testing set of queries',
    skip: () => iteration > 1 || argv.startFromTrainedEntities,
    task: async ctx => {
      // create wrappers for queries
      // to be able to save pre- and post-training data related to query
      ctx.entities = [];

      const trainingQueries = _.filter(ctx.queries, ({ _metadata: { type } }) => type === 'training');
      const testingQueries = _.filter(ctx.queries, ({ _metadata: { type } }) => type === 'testing');

      _.forEach(testingQueries, query => {
        ctx.entities.push({
          query: _.omit(query, ['_metadata']),
          training: [],
          metadata: query._metadata,
        });
      });

      ctx.queries = trainingQueries;

      if (argv.saveEachStepData) {
        await saveJsonToTempFile(`${stepsDirectory}/04-entities.json`, ctx.entities);
      }
    },
  },
  {
    title: 'Querying non-trained collection with testing set of queries',
    skip: () => argv.startFromTrainedEntities,
    task: async (ctx, task) => {
      ctx.entities = await addNonTrainedResults(ctx.entities, {
        task,
        queue: QUEUE_SIZE.NON_TRAINED,
        iteration,
        requestTimeout: REQUEST_TIMEOUT,
      });

      if (argv.saveEachStepData) {
        await saveJsonToTempFile(`${stepsDirectory}/05-entitiesWithNonTrainedResults.json`, ctx.entities);
      }
    },
  },
  {
    title: 'Uploading training data to Discovery collection',
    skip: () => argv.startFromTrainedEntities,
    task: async (ctx, task) => {
      await uploadTrainingData(ctx.queries, {
        task,
        queue: QUEUE_SIZE.UPLOAD,
        iteration,
      });
    },
  },
  {
    title: 'Waiting for Discovery collection to be trained',
    skip: () => argv.skipTraining || argv.startFromTrainedEntities,
    task: async (ctx, task) => {
      const status = await waitForTrainingCompletion(lastTrainedTime, { task });

      if (!status || !status.minimum_queries_added || !status.sufficient_label_diversity || !status.successfully_trained) {
        ctx.trainingFailed = true;
        ctx.trainingStatus = status;
        // throw new Error(`Collection training has failed: ${JSON.stringify(result)}`);
      }

      if (status) {
        lastTrainedTime = status.successfully_trained;
      }
    },
  },
  {
    title: 'Querying trained collection with testing set of queries',
    task: async (ctx, task) => {
      if (argv.startFromTrainedEntities) {
        ctx.entities = await importJsonFromTempFile(`${stepsDirectory}/05-entitiesWithNonTrainedResults.json`);
      }

      ctx.entities = await addTrainedResults(ctx.entities, {
        task,
        queue: QUEUE_SIZE.TRAINED,
        iteration,
        requestTimeout: REQUEST_TIMEOUT,
      });

      if (argv.saveEachStepData) {
        await saveJsonToTempFile(`${stepsDirectory}/06-entitiesWithTrainedResults.json`, ctx.entities);
        await writeTmpFile(`${stepsDirectory}/06-entitiesWithTrainedResults.csv`, convertEntitiesToCsv(ctx.entities));
      }
    },
  },
  {
    title: `Saving training data with queried collection results to ${ENTITIES_FILENAME}.json and ${ENTITIES_FILENAME}.csv`,
    task: async ({ entities }) => {
      await saveJsonToTempFile(`${ENTITIES_FILENAME}.json`, entities);
      await writeTmpFile(`${ENTITIES_FILENAME}.csv`, convertEntitiesToCsv(entities));
    },
  },
]);

const run = async context => {
  const dateFormat = 'DD MMM, YYYY HH:mm:ss';

  try {
    logger.info(`Training started at ${formatDate(getUTCDate(), dateFormat)}`);

    const tasks = createTasks();

    const ctx = await tasks.run(context);
    const { trainingFailed, trainingStatus } = ctx;

    if (trainingFailed) {
      logger.warn(trainingStatus, `Training of collection failed on iteration ${iteration}`);
    } else {
      logger.info(`Successfully trained collection on iteration ${iteration}.`);
    }

    if (currentIteration === MAX_ITERATIONS) {
      logger.info(`Training ended without errors at ${formatDate(getUTCDate(), dateFormat)}`);
      await delay(300);
      process.exit();
    }

    iteration++;
    currentIteration++;

    if (firstRun) {
      firstRun = false;
    }

    await run(ctx);
  } catch (err) {
    console.log(err);
    logger.error(...(_.has(err, 'response.data') ? [err.response.data, err.response.data.error] : [err]));
    logger.info(`Training ended with errors at ${formatDate(getUTCDate(), dateFormat)}`);
    await delay(300);
    process.exit(1);
  }
};

run({});
