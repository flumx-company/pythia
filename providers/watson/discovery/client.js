const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

const {
  services: {
    watson: {
      discovery: discoveryConfig,
    },
  },
} = require('../../../config');

module.exports = ({
  apiKey,
  url,
  apiVersionDate = discoveryConfig.apiVersionDate,
} = {}) => new DiscoveryV1({
  iam_apikey: apiKey,
  url,
  version: apiVersionDate,
});
