const _ = require('lodash');
const promisify = require('./promisify');

/**
 * Converts method names to Zendesk API methods object
 * which can be easily exported as a module.
 *
 * @param  {Array}  methods   Methods names.
 * @param  {Object} endpoint  API endpoint reference.
 * @return {Object}           Object of wrapped API methods.
 */
module.exports = (methods, endpoint) =>
  _.fromPairs(
    _.map(methods, name => [name, promisify(endpoint[name], endpoint)]),
  );
