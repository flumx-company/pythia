require('dotenv').config();

/**
 * Creates filters table
 * for https://docs.google.com/spreadsheets/d/1fctcmwCSqmq9MpE8p2lvYfTsgvzEXllsBsC1PBqj-1w/edit#gid=402640755 * based on exported ./tmp/queries.json.
 */
const _ = require('lodash');
const json2csv = require('json2csv');
const { argv } = require('yargs');
const logger = require('../helpers/logger');
const { importJsonFromTempFile, writeTmpFile } = require('../helpers/file');
const {
  include: {
    ticketForms: ticketFormsToInclude,
  },
} = require('../enums/filters');

const INPUT_FILENAME = argv.inputFilename || 'queries.json';
const OUTPUT_FILENAME = argv.outputFilename || 'queries.csv';

const allFilters = _.map(ticketFormsToInclude, 'entities');

const allFilterLabels = _(ticketFormsToInclude)
  .map(({ entities: { children } }) => children)
  .flatten()
  .uniq()
  .value();

const makeFiltersColumns = queryFilters =>
  _.reduce(allFilterLabels, (result, parentFilterLabel) => {
    const filter = _.find(queryFilters, queryFilter => queryFilter.type === parentFilterLabel);
    result[parentFilterLabel] = filter ? filter.count : '';
    return result;
  }, {});

const getParentFilterCountObject = filters => _.reduce(filters, (result, { type, count = 1 }) => {
  // find entity which contains query filter type in its children
  const entityWithChild = _.find(allFilters, ({ children }) =>
    _.includes(children, type));

  if (entityWithChild) {
    if (!result[entityWithChild.parent]) {
      result[entityWithChild.parent] = count;
    } else {
      result[entityWithChild.parent] += count;
    }
  }

  return result;
}, {});

const run = async () => {
  try {
    const data = await importJsonFromTempFile(INPUT_FILENAME);
    const queries = _(data).map('queries').flatten().value();

    // get array of parent filters in query
    const parentFilterEntities = _.map(
      queries,
      ({ _metadata: { filters } }) => getParentFilterCountObject(filters),
    );

    // calculate maximum size of parent filters
    // to generate required number of columns
    const maxParentFilterEntityCount = _.size(
      _.maxBy(parentFilterEntities, entity => _.size(entity)),
    );

    // generate object for parent filters columns population
    const parentFilterEntityObject = {};
    _.times(maxParentFilterEntityCount, index => {
      const number = index + 1;
      parentFilterEntityObject[`Filter ${number}`] = '';
      parentFilterEntityObject[`Filter ${number} Frequency`] = '';
    });

    const csv = json2csv({
      data: _(queries)
        .map(({ _metadata: { ticketFormName, filters }, natural_language_query }) => {
          const parentFilterObject = getParentFilterCountObject(filters);
          const parentFilterArray = _(parentFilterObject)
            .map((count, type) => ({ type, count }))
            .orderBy('count', 'desc')
            .value();

          const topFiltersObject = _.reduce(parentFilterArray, (result, { type, count }, index) => {
            const number = index + 1;
            result[`Filter ${number}`] = type;
            result[`Filter ${number} Frequency`] = count || '';
            return result;
          }, _.clone(parentFilterEntityObject));

          return {
            'Ticket Form': ticketFormName,
            'Ticket Text': natural_language_query,
            ...topFiltersObject,
            ...makeFiltersColumns(filters),
          };
        })
        // XXX: remove when duplicates are removed properly in services/training.js
        .uniqBy('Ticket Text')
        .value(),
    });

    await writeTmpFile(OUTPUT_FILENAME, csv);
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();
