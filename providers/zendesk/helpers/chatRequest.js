const _ = require('lodash');
const http = require('./http');
// const { services: { zendesk: zendeskConfig } } = require('../../../config');
const logger = require('../../../helpers/logger');
const { delay } = require('../../../helpers/misc');

module.exports = async (url,
  {
    method = 'get',
    maxRetries = 5,
    token,
  } = {
    method: 'get',
    maxRetries: 5,
  },
) => {
  let retries = 0;

  const handleRequest = async () => {
    try {
      const { data } = await http({
        method,
        url,
        baseURL: 'https://www.zopim.com/api/v2',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    } catch (err) {
      if (err.response) {
        logger.error({
          data: err.response.data,
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
