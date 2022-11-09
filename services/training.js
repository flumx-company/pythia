const _ = require('lodash');
const json2csv = require('json2csv');
const { Op, literal } = require('sequelize');
const macrosService = require('../services/macros');
const discovery = require('../providers/watson/discovery');
const nlu = require('../providers/watson/nlu');
const { cleanText } = require('../helpers/cleaner');
const logger = require('../helpers/logger');
const { delay, formatNaturalLanguageQuery } = require('../helpers/misc');
const { toPlain } = require('../helpers/database');
const filterEnums = require('../enums/filters');
const {
  ZendeskTicket,
  ZendeskTicketAudit,
  ZendeskTicketAuditEvent,
  ZendeskTicketForm,
  DiscoveryDocument,
  DiscoveryCollection,
} = require('../db/models');
const {
  services: {
    watson: {
      discovery: discoveryConfig,
    },
  },
} = require('../config');
const { translit } = require('../helpers/misc');

const ticketFormNames = _.map(filterEnums.include.ticketForms, 'name');

const MACRO_EVENT_TYPE = 'AgentMacroReference';
// const COMMENT_EVENT_TYPE = 'Comment';
// const USER_ROLE_LABEL = 'end-user';

const CONFIDENCE_INTERVAL = 1.96;
const MARGINAL_ERROR = 0.05;
const REQUEST_DELAY = 1000;

/**
 * Forms Discovery training data from Zendesk ticket audits. See more:
 * https://console.bluemix.net/docs/services/discovery/using.html#building-queries-and-delivering-content
 *
 * @return {Array} Discovery training data queries.
 */
exports.formTrainingDataQueries = async ({
  ticketLimit = 0,
  useTranslit = false,
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
  dbCollectionId,
} = {}) => {
  if (!dbCollectionId) {
    const dbCollection = await DiscoveryCollection.findOne({
      where: {
        discoveryId: discoveryConfig.collectionId,
      },
    });

    const collection = toPlain(dbCollection);
    dbCollectionId = collection.id;
  }

  const dbDocuments = await DiscoveryDocument.findAll({
    where: {
      discoveryCollectionId: dbCollectionId,
    },
  });

  const documents = toPlain(dbDocuments);

  const macros = await macrosService.getAll({
    username: zendeskUsername,
    token: zendeskApiToken,
    url: zendeskDomain,
  });

  const macroIdsToExclude = _(macros)
    .filter(({ title }) => _.includes(filterEnums.exclude.macroTitles, title))
    .map('id')
    .value();

  // TODO: get all audits and events with ticket at once.
  // At this moment following request (with subquery in 'where') returns only
  // one audit and event (and a random one), so further filtering returns inconsistent results.
  // For this to be implemented, keep track of these issues:
  // https://github.com/sequelize/sequelize/issues/5193
  // https://github.com/sequelize/sequelize/issues/5235

  // TODO: add all end-user (not agent) comments from all events before macro event.
  // At the moment it returns only one audit and one audit event without additional queries.
  // Also, users need to be added to database to distinguish agents from end-users.
  const getZendeskTickets = async (filtered = false) => ZendeskTicket.findAll({
    where: {
      '$audits.events.type$': MACRO_EVENT_TYPE,
      ...(filtered ? {
        // exclude tickets with specific macro titles
        '$audits.events.macroId$': {
          [Op.notIn]: macroIdsToExclude,
        },
        // exclude tickets with stop words found in the description
        description: {
          [Op.notILike]: {
            [Op.all]: _.map(filterEnums.exclude.ticketStopWords, word => `%${word}%`),
          },
        },
        // include tickets from specified forms only
        '$ticketForm.name$': {
          [Op.in]: ticketFormNames,
        },
        [Op.not]: [{
          // exclude tickets with specific tags
          tags: {
            [Op.overlap]: filterEnums.exclude.ticketTags,
          },
        }],
      } : {}),
    },
    include: [{
      model: ZendeskTicketAudit,
      as: 'audits',
      // subQuery: false,
      include: [{
        model: ZendeskTicketAuditEvent,
        as: 'events',
      }],
    }, {
      model: ZendeskTicketForm,
    }],
    attributes: [
      literal('DISTINCT ON("description") 1'),
      'id',
      'description',
      'tags',
    ],
  });

  // const dbTickets = await getZendeskTickets(false);
  // const tickets = toPlain(dbTickets);
  const filteredDbTickets = await getZendeskTickets(false);
  const filteredTickets = ticketLimit
    ? _.sampleSize(toPlain(filteredDbTickets), ticketLimit)
    : toPlain(filteredDbTickets);

  const generalPopulation = _.size(filteredTickets);
  const testingSampleMultipliers = [1, 1.5, 2, 2.5, 3, 5, 10, 20, 50];

  // group all tickets by ticket form
  const groupedByFormTickets = _.groupBy(filteredTickets, ({ ticketForm }) => ticketForm.id);

  // count tickets in each group to determine training set size later
  const totalTicketCountByForm = _.mapValues(groupedByFormTickets, ticketGroup => _.size(ticketGroup));

  // calculate testing sample ticket count for each ticket group.
  // Check formula reference here:
  // https://docs.google.com/spreadsheets/d/1fctcmwCSqmq9MpE8p2lvYfTsgvzEXllsBsC1PBqj-1w/edit#gid=208646402
  // TODO: use http://mathjs.org/ for more precise computations
  const testingSampleCountByForm = _.mapValues(groupedByFormTickets, ticketGroup => {
    const groupFraction = _.size(ticketGroup) / generalPopulation;
    const commonPart = (CONFIDENCE_INTERVAL * CONFIDENCE_INTERVAL) * groupFraction * (1 - groupFraction);
    const result = (generalPopulation * commonPart)
      / (((MARGINAL_ERROR * MARGINAL_ERROR) * generalPopulation) + commonPart);

    return Math.floor(result);
  });

  // find maximum multiplier for generating training sample
  // (i.e. multiplier after which training sample will be larger than total tickets).
  // Note: we are determining training multiplier for all groups
  // based on maximum ticket count per each group. E.g.:
  // first group total count: 50, first group testing count: 15, training multiplier is set to 3;
  // second group total count: 10, second group testing count: 4, multiplier is reduced to 2; etc.
  const groupTrainingSampleMultiplier = _.find(testingSampleMultipliers, (multiplier, index) => {
    const nextMultiplier = testingSampleMultipliers[index + 1];

    // if next multiplier exceeds total group size, current multiplier is taken
    return _.find(testingSampleCountByForm, (testingGroupSize, formId) => {
      const totalGroupSize = totalTicketCountByForm[formId];

      return (testingGroupSize * nextMultiplier) > totalGroupSize;
    });
  });

  // calculate training sample ticket count for each ticket group
  // by multiplying testing set group by multiplier minus one
  // to provide enough tickets to testing set
  // (as training and testing sets must not intersect)
  const trainingSampleCountByForm = _.mapValues(
    testingSampleCountByForm,
    testingGroupSize => testingGroupSize * (groupTrainingSampleMultiplier - 1),
  );

  // form training sample by picking random tickets for each group from total amount
  const trainingTicketSampleByForm = _.mapValues(
    trainingSampleCountByForm,
    (groupSize, formId) => {
      const ticketSampleGroup = _.sampleSize(groupedByFormTickets[formId], groupSize);

      // exclude tickets added to training set from total set
      // to form testing set without interseciton later
      groupedByFormTickets[formId] = _.filter(
        groupedByFormTickets[formId],
        ({ id }) => !_.find(ticketSampleGroup, ticket => ticket.id === id),
      );

      return ticketSampleGroup;
    },
  );

  // concatenate training sample tickets into single array
  const trainingTicketSample = _.reduce(
    trainingTicketSampleByForm,
    (ticketSample, groupedTickets) => _.concat(ticketSample, groupedTickets),
    [],
  );

  // ATTENTION: logic has changed, now we are forming testing set not from training one
  // but are creating separate training and testing sets without intersection
  //
  // form testing sample by picking random tickets for each group from training sample
  // and concatenate it into single array
  // const testingTicketSample = _.reduce(
  //   testingSampleCountByForm,
  //   (ticketSample, groupSize, formId) =>
  //     _.concat(ticketSample, _.sampleSize(trainingTicketSampleByForm[formId], groupSize)),
  //   [],
  // );

  // form testing sample by picking random tickets for each group from total tickets
  // left after forming training set and concatenate it into single array
  const testingTicketSample = _.reduce(
    testingSampleCountByForm,
    (ticketSample, groupSize, formId) => _.concat(
      ticketSample, _.sampleSize(groupedByFormTickets[formId], groupSize),
    ),
    [],
  );

  const formDocumentFromTicket = (ticket, type) => {
    const { ticketForm, description, id } = ticket;
    const ticketFormName = ticketForm && cleanText(ticketForm.name);
    // const ticketDescription = cleanText(description, filterEnums.clean.ticketDescriptions);
    const ticketDescription = description;
    // db request with relations in 'where' returns only one relation
    // (i.e. audit and event) at the moment as stated above
    const ticketMacroId = _.get(ticket, 'audits[0].events[0].macroId');
    // get document id uploaded to Discovery by ticket macro id
    // to utilize it as relevant example for query
    const relevantDocument = _.find(
      documents,
      ({ zendeskMacroId }) => ticketMacroId === zendeskMacroId,
    ) || {};

    return {
      natural_language_query: formatNaturalLanguageQuery(useTranslit ? translit(ticketDescription) : ticketDescription),
      examples: [
        {
          document_id: relevantDocument.discoveryId || null,
          relevance: 10,
        },
      ],
      _metadata: {
        ticketFormName: useTranslit ? translit(ticketFormName) : ticketFormName,
        relevantDocument,
        ticketMacroId,
        ticketId: id,
        type,
      },
    };
  };

  const trainingSample = _.map(trainingTicketSample, ticket => formDocumentFromTicket(ticket, 'training'));
  const testingSample = _.map(testingTicketSample, ticket => formDocumentFromTicket(ticket, 'testing'));

  return _.concat(trainingSample, testingSample);
};

/**
 * Builds Discovery training data from Zendesk
 * tickets and macros based on audits.
 *
 * @param  {Array}  queries The list of Discovery queries with proper format. For format see
 *                          https://console.bluemix.net/docs/services/discovery/query-reference.html#query-reference
 * @param  {Object} options
 *
 * @return {Array}          Training data queries with positive examples.
 */
/*
exports.addPositiveExamples = async (queries, {
  queue = 5,
  task = {},
} = {}) => {
  // TODO: get all audits and events with ticket at once. For this, keep track of this issue:
  // https://github.com/sequelize/sequelize/issues/5193
  // TODO: add comments from all end-user events before macro event
  // const queries = await formTrainingData();
  let currentQueryCount = 0;
  let notFoundQueryCount = 0;
  const totalQueryCount = _.size(queries);
  const chunks = _.chunk(queries, queue);
  let queriesWithPositiveExamples = [];

  const updateTaskOutput = (err = null, retries = 0) => {
    task.output = `${currentQueryCount}/${totalQueryCount} processed.`;

    if (err) {
      task.output += ` Error: ${err.message || err.code}, retrying. Retries: ${++retries}`;
    }
  };

  updateTaskOutput();

  for (const chunk of chunks) {
    const queryChunk = await Promise.all(
      _.map(chunk, async query => {
        // get document id from Discovery collection based on its title
        // TODO: some documents are not being found, check why
        const documentTitle = _.replace(query.examples[0].document_title, /"/g, '\\"');

        const addPositiveExamplesToQuery = async (retries = 0) => {
          try {
            const { results } = await discovery.collections.query({
              query: `title::"${documentTitle}"`,
            });

            // check if returned query is not empty
            if (_.isArray(results) && !_.isEmpty(results)) {
              const documentId = results[0].id;
              query.examples[0].document_id = documentId;
            } else {
              logger.warn(
                `Results not found for query with document title: '${documentTitle}'. Total: ${++notFoundQueryCount}.`
              );
            }

            delete query.examples[0].document_title;

            currentQueryCount++;
            updateTaskOutput();

            return query;
          } catch (err) {
            logger.error(err, `Add positive examples error document with title: ${documentTitle}`);
            updateTaskOutput(err, ++retries);
            return addPositiveExamplesToQuery(retries);
          }
        };

        return addPositiveExamplesToQuery();
      }),
    );

    queriesWithPositiveExamples = _.concat(
      queriesWithPositiveExamples,
      // make sure document id is present (as it is required for query)
      _.filter(
        queryChunk,
        query => query.examples && query.examples[0] && !!query.examples[0].document_id,
      ),
    );

    updateTaskOutput();
  }

  return queriesWithPositiveExamples;
};
*/

exports.addNegativeExamples = async (queries, {
  queue = 5,
  collectionId,
  environmentId,
  username,
  password,
  apiKey,
  url,
  task = {},
}) => {
  let currentQueryCount = 0;
  const totalQueryCount = _.size(queries);
  const chunks = _.chunk(queries, queue);
  let queriesWithNegativeExamples = [];

  const updateTaskOutput = (err = null, retries = 0) => {
    const message = `${currentQueryCount}/${totalQueryCount} processed.`;
    task.output = message;
    // logger.debug(message);

    if (err) {
      const errMessage = `Error: ${err.message || err.code}, retrying. Retries: ${++retries}`;
      task.output += ` ${errMessage}`;

      logger.debug(errMessage);
    }
  };

  updateTaskOutput();

  for (const chunk of chunks) {
    const queryChunk = await Promise.all(_.map(chunk, async query => {
      // const validDocumentId = query.examples[0].document_id;
      const validDocumentId = _.find(
        query.examples,
        ({ relevance }) => relevance === 10,
      ).document_id;

      const naturalLanguageQuery = query.natural_language_query;

      const addNegativeExamplesToQuery = async (retries = 0) => {
        try {
          const { results } = await discovery.collections.query({
            environmentId,
            collectionId,
            username,
            password,
            apiKey,
            url,
            natural_language_query: naturalLanguageQuery,
            count: 10,
          });

          // add macros documents that don't match query as negative examples
          _.forEach(results, result => {
            if (result.id !== validDocumentId) {
              query.examples.push({
                document_id: result.id,
                relevance: 0,
              });
            }
          });

          currentQueryCount++;
          updateTaskOutput();

          return query;
        } catch (err) {
          logger.error(err, `Add negative examples error document with query: ${naturalLanguageQuery}`);
          updateTaskOutput(err, ++retries);
          await delay(REQUEST_DELAY);
          return addNegativeExamplesToQuery(retries);
        }
      };

      await delay(REQUEST_DELAY);
      return addNegativeExamplesToQuery();
    }));

    queriesWithNegativeExamples = [...queriesWithNegativeExamples, ...queryChunk];
  }

  return queriesWithNegativeExamples;
};

exports.getFilterArray = entities => {
  // const filterTypesToInclude = _(filterEnums.include.ticketForms)
  //   .map(({ entities: { children } }) => children)
  //   .flatten()
  //   .uniq()
  //   .value();

  // count entities by type, sort by frequency and form an array
  const filters = _(entities)
    .groupBy('type')
    .map((entity, key) => ({
      type: key,
      count: _.reduce(entity, (sum, { count: usageCount }) => sum + usageCount, 0),
    }))
    // .filter(({ type }) => _.includes(filterTypesToInclude, type))
    .orderBy('count', 'desc')
    // CASE 3 - Getting top 3 entities (+ comment queryParentEntities)
    // .take(3)
    .value();

  return filters;
};

exports.formFilterStringFromArray = filters => { /* eslint-disable */
  // form DQL filters based on NLU model request results.
  // For that, include all child entities from
  // top 2 parent entities found in query with OR logic. For reference, see
  // https://aword.slack.com/archives/C02JBQGPL/p1508436232000211
  const queryParentEntities = _(filters)
    // group filters by parent entity
    .groupBy(({ type }) => {
      const ticketFormWithEntity = _.find(
        filterEnums.include.ticketForms,
        ({ entities: { children } }) => _.includes(children, type),
      );

      return ticketFormWithEntity ? ticketFormWithEntity.entities.parent : null;
    })
    .omit('null')
    // count parent entities frequency
    .map((queryFilters, type) => ({
      type,
      count: _.sumBy(queryFilters, 'count'),
    }))
    .orderBy('count', 'desc')
    // CASE 1 - Getting top 2 entity groups
    // .take(2)
    // CASE 2 - Getting top 1 entity group
    .take(1)
    .value();

  // build query filter based on NLU entities
  const filterString = _.reduce(queryParentEntities, (parentString, { type }) => {
    const ticketFormWithEntity = _.find(filterEnums.include.ticketForms, ({ entities: { parent } }) => parent === type);

    if (!ticketFormWithEntity) {
      return parentString;
    }

    if (_.size(parentString)) {
      parentString += '|';
    }

    parentString += _.reduce(
      ticketFormWithEntity.entities.children,
      (childString, childEntityType) => `
        ${childString}${_.size(childString) ? '|' : ''}enriched_text.entities.type::"${childEntityType}"
      `,
      '',
    );

    return parentString;
  }, '');

  // CASE 3 - Getting top 3 entities
  // CASE 4 - Getting all entities
  // const filterString = _.reduce(filters, (filterString, { type }) => {
  //   if (_.size(filterString)) {
  //     filterString += '|';
  //   }

  //   filterString += `enriched_text.entities.type::"${type}"`;

  //   return filterString;
  // }, '');

  return filterString;
};

exports.addFilters = async (queries, {
  task = {},
  queue = 5,
  nluModelId,
  nluApiKey,
} = {}) => {
  let count = 0;
  const total = _.size(queries);
  const chunks = _.chunk(queries, queue);
  let queriesWithFilters = [];

  for (const chunk of chunks) {
    const queriesWithFiltersChunk = await Promise.all(_.map(chunk, async query => {
      const addFiltersToQuery = async (retries = 0) => {
        try {
          const { entities } = await nlu.analyze({
            text: query.natural_language_query,
            features: 'entities',
            language: 'ru',
            'entities.model': nluModelId,
          }, {
            auth: {
              username: 'apikey',
              password: nluApiKey,
            },
          });

          const filters = exports.getFilterArray(entities);

          query._metadata.filters = filters;

          const filterString = exports.formFilterStringFromArray(filters);

          query.filter = filterString;

          task.output = `${++count}/${total} processed.`;

          return query;
        } catch (err) {
          const errorReason = err.message || err.code;
          const currentRetryCount = ++retries;

          task.output = `${count}/${total} processed. Error: ${errorReason}, retrying. Retries: ${currentRetryCount}`;
          logger.error(err);

          if (currentRetryCount > 9) {
            query.filter = null;
            query._metadata.error = errorReason;
            return query;
          }

          await delay(REQUEST_DELAY);
          return addFiltersToQuery(currentRetryCount);
        }
      };

      await delay(REQUEST_DELAY);
      return addFiltersToQuery();
    }));

    queriesWithFilters = [...queriesWithFilters, ...queriesWithFiltersChunk];
  }

  return queriesWithFilters;
};

const addQueryResults = async (entities, {
  environmentId,
  collectionId,
  apiKey,
  url,
  task = {},
  queue = 5,
  iteration = 1,
  trained = false,
  requestTimeout = 60000,
} = {}) => {
  let progress = 0;
  const total = _.size(entities);

  const chunks = _.chunk(entities, queue);
  let entitiesWithTrainingData = [];

  for (const chunk of chunks) {
    const entitiesChunk = await Promise.all(_.map(chunk, async entity => {
      const { query } = entity;
      /**
       * Queries Discovery collection.
       *
       * @param  {Number} retries
       * @return {Object} queryResults
       * @param           queryResults.results Query results.
       * @param           queryResults.error   Discovery request error. Null if response is ok.
       */
      const queryCollection = async (retries = 0) => {
        const data = {
          natural_language_query: query.natural_language_query,
          filter: query.filter,
          count: 1000,
          environmentId,
          collectionId,
          apiKey,
          url,
        };

        try {
          const queryResponse = await Promise.race([
            delay(requestTimeout).then(() => Promise.reject(new Error('Discovery query request timeout'))),
            discovery.collections.query(data),
          ]);

          let queryError = null;

          if (!queryResponse.results || _.isEmpty(queryResponse.results)) {
            queryResponse.results = [];
            queryError = new Error('There were no Discovery query results');
          }

          return {
            results: queryResponse.results,
            error: queryError,
          };
        } catch (err) {
          if (retries === 3) {
            return {
              results: [],
              error: new Error(`Discovery query faced max retries, error: ${err.message || err.code}`),
            };
          }

          task.output = `Discovery collection query error: ${err.message || err.code}, retrying. Retries: ${++retries}`;

          logger.error({
            error: err,
            data,
          });

          await delay(REQUEST_DELAY);
          return queryCollection(retries);
        }
      };

      let trainingDataElement = _.find(
        entity.training,
        ({ iteration: trainingIteration }) => trainingIteration === iteration,
      );

      if (!trainingDataElement) {
        trainingDataElement = {
          iteration,
        };

        entity.training = [...entity.training, trainingDataElement];
      }

      const {
        results: queryResults,
        error: queryError,
      } = await queryCollection();

      // we're ensured that document with relevance === 10
      // already exists (added to the query at previous step)
      const relevantDocumentId = _.find(query.examples, ({ relevance }) => relevance === 10).document_id;
      let relevantQueryResultIndex;
      const relevantQueryResult = _.find(queryResults, ({ id }, index) => {
        const result = id === relevantDocumentId;

        // save rank of doc (position of the doc in set of returned documents).
        // For every iteration this rank should grow (e.g. 100 -> 75 -> 30 -> 1).
        if (result) {
          relevantQueryResultIndex = index;
        }

        return result;
      });

      const queryResult = {
        rank: null,
        document: null,
      };

      // save result of querying non- or trained collection
      // if Discovery document is found in top 100 results
      if (relevantQueryResult) {
        queryResult.rank = relevantQueryResultIndex + 1;
        queryResult.document = _.pick(relevantQueryResult, ['id', 'title', 'text']);
      } else if (queryError) {
        queryResult.error = queryError.message;
      } else if (!_.size(queryResults)) {
        queryResult.error = 'There were no Discovery query results.';
      } else {
        queryResult.error = `Document not found in ${_.size(queryResults)} Discovery query results.`;
      }

      trainingDataElement[trained ? 'after' : 'before'] = queryResult;

      task.output = `${++progress}/${total} proceeded.`;

      return entity;
    }));

    entitiesWithTrainingData = [...entitiesWithTrainingData, ...entitiesChunk];
  }

  return entitiesWithTrainingData;
};

// the only difference between the two following methods
// is which entity field is being populated
exports.addNonTrainedResults = (entities, params) => addQueryResults(entities, {
  ...params,
  trained: false,
});

exports.addTrainedResults = (entities, params) => addQueryResults(entities, {
  ...params,
  trained: true,
});

exports.uploadTrainingData = async (queries, {
  environmentId,
  collectionId,
  username,
  password,
  apiKey,
  url,
  task = {},
  queue = 5,
} = {}) => {
  const total = _.size(queries);
  const result = [];
  let errored = 0;

  const chunks = _.chunk(queries, queue);

  let getTitle = () => `${_.size(result)}/${total} uploaded.`;

  for (const chunk of chunks) {
    await Promise.all(_.map(chunk, async query => {
      try {
        // clean up query to match Discovery format
        if (query._metadata) {
          delete query._metadata;
        }
        logger.debug(`Uploaded training data: ${query}`);

        const data = await discovery.collections.addTrainingData({
          environmentId,
          collectionId,
          username,
          password,
          apiKey,
          url,
          body: query,
        });

        result.push(data);
      } catch (err) {
        if (!errored) {
          getTitle = () => `${_.size(result)}/${total} uploaded, ${errored} errored.`;
        }

        errored++;

        const title = getTitle();
        task.output = title;
        logger.debug(title);
      }
    }));
  }

  return result;
};

exports.waitForTrainingCompletion = async (
  lastTrainedTime = null,
  {
    task = {},
    username,
    password,
    apiKey,
    url,
    environmentId,
    collectionId,
  } = {},
) => {
  const pingForStatus = async () => {
    try {
      const { training_status: status } = await discovery.collections.listDetails({
        environmentId,
        collectionId,
        username,
        password,
        apiKey,
        url,
      });

      // training is completed when successfully trained time is updated
      if (status.successfully_trained && status.successfully_trained !== lastTrainedTime) {
        return status;
      }

      task.output = `Still training, last checked ${new Date().toLocaleString()}`;
    } catch (err) {
      logger.error(err);
    }

    await delay(60 * 1000);
    return pingForStatus();
  };

  return pingForStatus();
};

exports.convertEntitiesToCsv = entities => json2csv({
  data: _.map(entities, ({ query, training, metadata = {} }) => {
    const result = {
      'Ticket Text': query.natural_language_query,
      'Ticket Form': metadata.ticketFormName || 'N/A',
      'Used Macro': metadata.relevantDocument.title || 'N/A',
      'Used Filter': query.filter,
    };

    _.forEach(training, ({ iteration, before, after }) => {
      if (iteration === 1) {
        result['Rank Before Training'] = (before && before.rank) || 'N/A';
      }

      result[`Rank After Training ${iteration}`] = (after && after.rank) || 'N/A';
    });

    return result;
  }),
});
