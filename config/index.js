require('dotenv').config();

const _ = require('lodash');
const baseConfig = require('./base.json');

let localConfig = {};

try {
  // eslint-disable-next-line
  localConfig = require('./local.json');
} catch (err) {
  // no error
}

const {
  CONFIG,
  NODE_ENV,
  PORT,
  LOG_FILE,
  DISCOVERY_USERNAME,
  DISCOVERY_PASSWORD,
  DISCOVERY_API_KEY,
  DISCOVERY_URL,
  DISCOVERY_COLLECTION_ID,
  DISCOVERY_CONFIGURATION_ID,
  DISCOVERY_ENVIRONMENT_ID,
  NLU_USERNAME,
  NLU_PASSWORD,
  NLU_URL,
  NLU_MODEL_ID,
  POSTGRES_PORT,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  REDIS_PORT,
  ZENDESK_USERNAME,
  ZENDESK_TOKEN,
  ZENDESK_PASSWORD,
  ZENDESK_URL,
} = process.env;

let envConfig = {};

const env = NODE_ENV || 'development';

try {
  // eslint-disable-next-line global-require
  envConfig = require(`./${CONFIG || env}.json`);
} catch (err) {
  // no error
}

const config = _.merge(baseConfig, envConfig, localConfig, {
  env,
  isProduction: env !== 'development',
  services: {
    watson: {
      discovery: {
        username: DISCOVERY_USERNAME,
        password: DISCOVERY_PASSWORD,
        apiKey: DISCOVERY_API_KEY,
        collectionId: DISCOVERY_COLLECTION_ID,
        configurationId: DISCOVERY_CONFIGURATION_ID,
        environmentId: DISCOVERY_ENVIRONMENT_ID,
        url: DISCOVERY_URL,
        maximumNaturalLanguageQueryLength: 500,
      },
      nlu: {
        username: NLU_USERNAME,
        password: NLU_PASSWORD,
        modelId: NLU_MODEL_ID,
        url: NLU_URL,
      },
    },
    zendesk: {
      username: ZENDESK_USERNAME,
      token: ZENDESK_TOKEN,
      password: ZENDESK_PASSWORD,
      url: ZENDESK_URL,
    },
  },
  db: {
    port: POSTGRES_PORT,
    name: POSTGRES_DB,
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
  },
  redis: {
    port: REDIS_PORT,
  },
  server: {
    port: PORT,
  },
  logging: {
    filePath: LOG_FILE,
  },
});

module.exports = config;
