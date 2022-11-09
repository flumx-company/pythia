require('dotenv').config();

const _ = require('lodash');
const json2csv = require('json2csv');
const { argv } = require('yargs');
const discovery = require('../providers/watson/discovery');
const logger = require('../helpers/logger');
const { writeTmpFile } = require('../helpers/file');

const NOTICES_CSV_FILENAME = 'notices.csv';
const NOTICE_COUNT = argv.noticeCount || 100;

const run = async () => {
  try {
    const data = await discovery.collections.queryNotices({ count: NOTICE_COUNT });

    if (argv.saveToFile) {
      const csv = json2csv({
        data: _.map(data.results, ({ notices }) => {
          const { description, notice_id, document_id, severity } = notices[0];

          return {
            notice_id,
            description,
            document_id,
            severity,
          };
        }),
      });

      await writeTmpFile(NOTICES_CSV_FILENAME, csv);
    } else {
      logger.info(data);
    }

    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();
