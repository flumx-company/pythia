const _ = require('lodash');
const qs = require('qs');
const joinUrl = require('url-join');
const http = require('./http');
const { delay } = require('../../../helpers/misc');
const { services: { zendesk: zendeskConfig } } = require('../../../config');
const logger = require('../../../helpers/logger');

/**
 * Constructs query string for Zendesk API call.
 *
 * @param  {Object} query Query object to be processed.
 * @return {String}       Resulting query string.
 */
const buildQueryString = (query = {}) => {
  if (_.isArray(query.include) && !_.isEmpty(query.include)) {
    query.include = _.join(query.include, ',');
  }

  return _.isEmpty(query) ? '' : `?${qs.stringify(query, { encode: false })}`;
};

/**
 * Transforms result keys to camel case to match JS format.
 *
 * @param  {String} endpoint Zendesk API endpoint.
 * @param  {Object} data     Result of the API call.
 * @return {Object}          Resulting object with camel-cased keys.
 */
const buildReturnValue = (endpoint, data) => _.mapKeys(data, (value, key) => _.camelCase(key));

/**
 * Makes generic request to Zendesk API.
 *
 * @param  {String} method   Request method.
 * @param  {String} endpoint Zendesk API endpoint.
 * @param  {Object} query    Request query object.
 * @return {Object}          Response.
 */
// XXX: make this export default
// XXX: align request API with chatRequest one
exports.request = async (
  method = 'get',
  endpoint,
  query = {},
  {
    maxRetries = 5,
    token = zendeskConfig.token,
    username = zendeskConfig.username,
    url = zendeskConfig.url,
  } = {
    maxRetries: 5,
    token: zendeskConfig.token,
    username: zendeskConfig.username,
    url: zendeskConfig.url,
  },
) => {
  let retries = 0;

  if (!_.includes(url, 'zendesk.com/api/v2')) {
    if (_.includes(url, 'zendesk.com')) {
      // assume user provided full url (but without /api part)
      url = joinUrl(url, '/api/v2');
    } else {
      // assume user provided just domain
      url = `https://${url}.zendesk.com/api/v2`;
    }
  }

  if (!query) {
    query = {};
  }

  const handleRequest = async () => {
    const apiUrl = `${endpoint}.json${buildQueryString(query)}`;

    try {
      const { data } = await http({
        method,
        url: apiUrl,
        baseURL: url,
        auth: {
          username: `${username}/token`,
          password: token,
        },
      });

      return buildReturnValue(endpoint, data);
    } catch (err) {
      if (err.response) {
        logger.error({
          data: err.response.data,
          url: `${url}/${apiUrl}`,
          status: err.response.status,
          headers: err.response.headers,
        }, `Retry: ${retries}`);
      } else if (err.request) {
        logger.error(err.request);
      } else {
        logger.error(err);
      }

      if (++retries < maxRetries) {
        await delay(5000);
        return handleRequest();
      }

      throw new Error(_.get(err, 'response.data.error.message') || err);
    }
  };

  return handleRequest();
};
