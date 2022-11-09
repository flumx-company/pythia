require('dotenv').config();

const _ = require('lodash');
const json2csv = require('json2csv');
const { argv } = require('yargs');
const logger = require('../helpers/logger');
const { importJsonFromTempFile, writeTmpFile } = require('../helpers/file');

const INPUT_FILE_PATH = argv.input || 'entities.json';
const OUTPUT_FILE_PATH = argv.output || 'entities.csv';

const run = async () => {
  try {
    const entities = await importJsonFromTempFile(INPUT_FILE_PATH);

    const csv = json2csv({
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

    await writeTmpFile(OUTPUT_FILE_PATH, csv);
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();
