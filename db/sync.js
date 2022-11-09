const _ = require('lodash');
const { argv } = require('yargs');
const sequelize = require('./sequelize');
const models = require('./models');
const logger = require('../helpers/logger');
const { delay } = require('../helpers/misc');

const { force, alter } = argv;

const run = async () => {
  try {
    for (const model of _.values(models)) {
      if ('associate' in model) {
        // await model.associate({ force });
      }
    }

    await sequelize.sync({ force, alter });

    logger.info(`Models ${force ? 'force-' : ''}synced successfully${alter ? ' with altering' : ''}.`);
    await delay(300);
    process.exit(0);
  } catch (err) {
    logger.error(err);
    await delay(300);
    process.exit(1);
  }
};

run();
