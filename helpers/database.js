const _ = require('lodash');

/**
 * Converts Sequelize db entities to plain objects
 * with non-stringified values and all associations left in place.
 * For details, see
 * https://stackoverflow.com/questions/21961818/sequelize-convert-entity-to-plain-object
 *
 * @param  {Array|Object} response Database entities from Sequelize response.
 *
 * @return {Array|Object}          Plain object or array of objects.
 */
exports.toPlain = response => {
  if (!response) {
    return null;
  }

  const flattenDataValues = ({ dataValues }) =>
    _.mapValues(dataValues, value => (
      _.isArray(value) && _.isObject(value[0]) && _.isObject(value[0].dataValues)
        ? _.map(value, flattenDataValues)
        : _.isObject(value) && _.isObject(value.dataValues)
          ? flattenDataValues(value)
          : value
    ));

  return _.isArray(response) ? _.map(response, flattenDataValues) : flattenDataValues(response);
};
