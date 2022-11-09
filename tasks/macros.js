require('dotenv').config();

const { resolve } = require('path');
const _ = require('lodash');
const Listr = require('listr');
const { argv } = require('yargs');
const logger = require('../helpers/logger');
const { zipDirectory } = require('../helpers/file');
const {
  importJsonFromTempFile,
  saveJsonToFile,
  saveJsonToTempFile,
} = require('../helpers/file');
const macrosService = require('../services/macros');

if (process.env.NODE_ENV !== 'production') {
  require('longjohn'); // eslint-disable-line
}

const DOCUMENT_QUEUE_COUNT = argv.documentQueueCount || 20;
const MACROS_FOLDER_PATH = 'tmp/macros/';
const MACROS_ZIP_PATH = 'tmp/macros.zip';
const MACROS_JSON_FILENAME = 'macros.json';
const MACROS_CLEANED_FILENAME = 'macros.cleaned.json';

const useTranslit = !argv.noTranslit;

const tasks = new Listr([
  {
    title: 'Removing existing documents from Discovery collection',
    skip: () => !argv.deleteAllDocuments,
    task: async (ctx, task) => {
      await macrosService.deleteDocuments({ task });
    },
  },
  {
    title: 'Getting macros from Zendesk',
    skip: () => !!argv.fromFile,
    task: async ctx => {
      const macros = await macrosService.getAll();

      ctx.macros = macros;
    },
  },
  {
    title: 'Saving macros to tmp/macros.json',
    skip: () => !argv.saveJsonToFile || !!argv.fromFile,
    task: ({ macros }) => saveJsonToTempFile(MACROS_JSON_FILENAME, macros),
  },
  {
    title: 'Retrieving macros from tmp/macros.json',
    skip: () => !argv.fromFile,
    task: async ctx => {
      const macros = await importJsonFromTempFile(MACROS_JSON_FILENAME);

      ctx.macros = macros;
    },
  },
  {
    title: 'Cleaning up and processing macros',
    task: ctx => {
      const cleanedMacros = macrosService.process(ctx.macros, { useTranslit });

      ctx.macros = cleanedMacros;
    },
  },
  {
    title: `Saving cleaned macros to tmp/${MACROS_CLEANED_FILENAME}`,
    task: async ctx => {
      await saveJsonToTempFile(
        MACROS_CLEANED_FILENAME,
        ctx.macros,
      );
    },
  },
  {
    title: 'Converting and saving cleaned macros to CSV',
    skip: () => !argv.csv,
    task: async ctx => {
      await macrosService.exportToCSV(ctx.macros);
    },
  },
  {
    title: `Writing cleaned macros to separate files and creating ${MACROS_ZIP_PATH}`,
    skip: () => !argv.zip,
    task: async ctx => {
      await Promise.all(
        _.map(ctx.macros, (macro, index) =>
          saveJsonToFile(
            resolve(
              __dirname,
              '..',
              MACROS_FOLDER_PATH,
              `macro-${_.padStart(index, 3, '0')}.json`,
            ),
            macro,
          ),
        ),
      );

      await zipDirectory(resolve(__dirname, '..', MACROS_FOLDER_PATH), resolve(__dirname, '..', MACROS_ZIP_PATH));
    },
  },
  {
    title: 'Creating new Discovery collection',
    skip: () => !argv.createCollection || !!argv.saveJsonToFile || !!argv.zip || !!argv.csv,
    task: async ctx => {
      const collectionId = await macrosService.createCollection(argv.createCollection);

      ctx.collectionId = collectionId;
    },
  },
  {
    title: 'Uploading macros as documents to Discovery collection and saving them in the database',
    skip: () => !!argv.saveJsonToFile || !!argv.zip || !!argv.csv,
    task: async (ctx, task) => {
      try {
        ctx.totalUploadedCount = await macrosService.uploadMacros(ctx.macros, {
          collectionId: ctx.collectionId,
          task,
          queue: DOCUMENT_QUEUE_COUNT,
        });
      } catch (err) {
        logger.error(err);
      }
    },
  },
]);

const run = async () => {
  try {
    const ctx = await tasks.run();

    logger.info({
      'Total Zendesk macros': _.size(ctx.macros),
      'Uploaded as documents to Discovery': ctx.totalUploadedCount,
      ...ctx.collectionId ? { 'Created collection id': ctx.collectionId } : {},
    }, 'Macros have been successfully uploaded to collection.');
    process.exit(0);
  } catch (err) {
    logger.error(...(_.has(err, 'response.data') ? [err.response.data, err.response.data.error] : [err]));
    process.exit(1);
  }
};

run();
