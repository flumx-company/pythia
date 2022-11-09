const { promisify } = require('util');
const _ = require('lodash');
const rawClient = require('../rawClient');
const createClient = require('../client');
const logger = require('../../../../helpers/logger');
const { services: { watson: { discovery: discoveryConfig } } } = require('../../../../config');

exports.create = async ({
  name,
  description,
  language = 'en',
  environmentId,
  // XXX: remove configurationId parameter, seems to be not needed
  configurationId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const { data } = await rawClient.post(
    `environments/${environmentId}/collections`,
    {
      name,
      description,
      language,
      configuration_id: configurationId,
    },
    {
      baseURL: `${url}/${apiVersion}`,
      auth: {
        username: 'apikey',
        password: apiKey,
      },
    },
  );

  return data;
};

exports.list = ({
  environmentId,
  apiKey,
  url,
  apiVersionDate = discoveryConfig.apiVersionDate,
} = {}) => {
  const client = createClient({
    apiKey,
    url,
    apiVersionDate,
  });

  // XXX: replace with rawClient
  return promisify(client.listCollections.bind(client))({
    environment_id: environmentId,
  }).then(({ collections }) => collections);
};

exports.listDetails = async ({
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const endpoint = `environments/${environmentId}/collections/${collectionId}`;

  try {
    const { data } = await rawClient.get(
      endpoint,
      {
        baseURL: `${url}/${apiVersion}`,
        auth: {
          username: 'apikey',
          password: apiKey,
        },
      },
    );

    return data;
  } catch (err) {
    logger.error({ err, endpoint, response: _.get(err, 'response.data') }, 'Discovery: List collection details error');
    throw err;
  }
};

exports.query = async ({
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
  ...params
} = {}) => {
  const endpoint = `environments/${environmentId}/collections/${collectionId}/query`;

  if (!apiKey) {
    throw new Error(`Discovery API key is missing. Endpoint: ${endpoint}]`);
  }

  try {
    const { data } = await rawClient.get(
      endpoint,
      {
        baseURL: `${url}/${apiVersion}`,
        params,
        auth: {
          username: 'apikey',
          password: apiKey,
        },
      },
    );

    return data;
  } catch (err) {
    logger.error(
      { err, params, endpoint, response: _.get(err, 'response.data') },
      `Discovery: Query error: ${err.message}`,
    );
    throw err;
  }
};

exports.queryNotices = async ({
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
  ...params
} = {}) => {
  const { data } = await rawClient.get(
    `environments/${environmentId}/collections/${collectionId}/notices`,
    {
      baseURL: `${url}/${apiVersion}`,
      params,
      auth: {
        username: 'apikey',
        password: apiKey,
      },
    },
  );

  return data;
};

exports.addTrainingData = async ({
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
  body = {},
} = {}) => {
  const { data } = await rawClient.post(
    `environments/${environmentId}/collections/${collectionId}/training_data`,
    body,
    {
      baseURL: `${url}/${apiVersion}`,
      auth: {
        username: 'apikey',
        password: apiKey,
      },
    },
  );

  return data;
};

exports.listTrainingData = async ({
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const { data } = await rawClient.get(
    `environments/${environmentId}/collections/${collectionId}/training_data`,
    {
      baseURL: `${url}/${apiVersion}`,
      auth: {
        username: 'apikey',
        password: apiKey,
      },
    },
  );

  return data;
};

exports.deleteAllTrainingData = async ({
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion,
}) => {
  const { data } = rawClient.delete(
    `environments/${environmentId}/collections/${collectionId}/training_data`,
    {
      baseURL: `${url}/${apiVersion}`,
      auth: {
        username: 'apikey',
        password: apiKey,
      },
    },
  );

  return data;
};

exports.delete = async (id, {
  environmentId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const { data } = await rawClient.delete(
    `environments/${environmentId}/collections/${id}`,
    {
      baseURL: `${url}/${apiVersion}`,
      auth: {
        username: 'apikey',
        password: apiKey,
      },
    },
  );

  return data;
};
