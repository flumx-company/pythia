require('dotenv').config();

const _ = require('lodash');

const { db: { username, password, host, port, name: database } } = require('../config');

const config = _.reduce(['development', 'staging', 'production'], (configObject, env) => {
  configObject[env] = {
    username,
    password,
    database,
    host,
    port,
    dialect: 'postgres',
  };

  return configObject;
}, {});

module.exports = config;
