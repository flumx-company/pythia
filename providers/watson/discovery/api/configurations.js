const rawClient = require('../rawClient');
const { services: { watson: { discovery: discoveryConfig } } } = require('../../../../config');

exports.list = async ({
  environmentId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const { data } = await rawClient.get(
    `environments/${environmentId}/configurations`,
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
