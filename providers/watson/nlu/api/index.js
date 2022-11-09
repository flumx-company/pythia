const _ = require('lodash');
const rawClient = require('../rawClient');
const logger = require('../../../../helpers/logger');

exports.analyze = async (params = {}, miscParams = {}) => {
  try {
    const { data } = await rawClient.get('analyze', {
      params,
      ...miscParams,
    });

    return data;
  } catch (err) {
    logger.error({ params, err, response: _.get(err, 'response.data') }, 'NLU: Analyze error');
    throw new Error(err);
  }
};
