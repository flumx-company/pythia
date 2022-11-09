require('dotenv').config();

const discovery = require('../providers/watson/discovery');
const logger = require('../helpers/logger');

const run = async () => {
  try {
    const data = await discovery.collections.list();
    logger.info(data);
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();
