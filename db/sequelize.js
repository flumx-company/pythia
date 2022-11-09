const pg = require('pg');

// see: https://github.com/sequelize/sequelize/issues/3781#issuecomment-104278869
delete pg.native;

const Sequelize = require('sequelize');
const { db: { name, username, password, host, port } } = require('../config');
const logger = require('../helpers/logger');

module.exports = new Sequelize(name, username, password, {
  host,
  port,
  dialect: 'postgres',
  pool: {
    max: 50,
    min: 0,
    idle: 10000,
    evict: 10000,
    acquire: 60000,
  },
  logging: (...args) => logger.trace(...args),
});
