require('dotenv').config();

const _ = require('lodash');
const json2csv = require('json2csv');
const { argv } = require('yargs');
const logger = require('../helpers/logger');
const { importJsonFromTempFile, writeTmpFile } = require('../helpers/file');

const INPUT_FILE_PATH = argv.input || 'queries.json';
const OUTPUT_FILE_PATH = argv.output || 'queries.csv';

const run = async () => {
  try {
    const queries = await importJsonFromTempFile(INPUT_FILE_PATH);

    const csv = json2csv({
      data: _.map(queries, query => {
        const result = {
          'Ticket Text': query.natural_language_query,
          'Used Macro': query._metadata.relevantDocument.title || 'N/A',
        };

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
