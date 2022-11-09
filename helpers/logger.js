const { resolve } = require('path');
const bunyan = require('bunyan');
const Bunyan2Loggly = require('bunyan-loggly');
const { logging, logging: { loggly: logglyConfig } } = require('../config');

const { LOG_LEVEL, LOG_PATH } = process.env;

const level = LOG_LEVEL || 'debug';

const path = LOG_PATH || (logging.isRelative
  ? resolve(__dirname, '../', logging.filePath)
  : logging.filePath);

const streams = [];

if (logglyConfig) {
  const logglyStream = new Bunyan2Loggly({
    ...logglyConfig,
    isBulk: false,
  });

  streams.push({
    level,
    type: 'raw',
    stream: logglyStream,
  });
} else {
  streams.push({
    level,
    path,
  });
}

const logger = bunyan.createLogger({
  streams,
  name: 'pythia',
  serializers: bunyan.stdSerializers,
});

module.exports = logger;
