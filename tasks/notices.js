require('dotenv').config();

const _ = require('lodash');
const json2csv = require('json2csv');
const Listr = require('listr');
const { argv } = require('yargs');
const { Op } = require('sequelize');
const logger = require('../helpers/logger');
const discovery = require('../providers/watson/discovery');
const { saveJsonToTempFile, writeTmpFile } = require('../helpers/file');
const { DiscoveryDocument } = require('../db/models');
const { toPlain } = require('../helpers/database');

const COUNT = argv.count || 10000;
const NOTICES_JSON_FILENAME = argv.outputJsonFilename || 'relevantNotices.json';
const NOTICES_CSV_FILENAME = argv.outputCsvFilename || 'relevantNotices.csv';

const tasks = new Listr([
  {
    title: 'Getting notices from Discovery collection',
    task: async ctx => {
      const { results } = await discovery.collections.queryNotices({
        count: COUNT,
        // eslint-disable-next-line max-len
        query: 'notices.description::"Invalid training data found: The document was not returned in the top 100 search results for the given query, and will not be used for training"',
      });

      ctx.notices = _.map(results, ({ id, notices }) => {
        const {
          document_id: documentId,
          query_id: queryId,
          description,
          created: createdAt,
        } = notices[0];

        return {
          id,
          documentId,
          queryId,
          description,
          createdAt,
        };
      });
    },
  },
  {
    title: 'Getting training data from Discovery collection and retrieving relevant document ids',
    task: async ctx => {
      const { queries } = await discovery.collections.listTrainingData();

      ctx.queries = _(queries).map(
        ({
          query_id: queryId,
          natural_language_query: naturalLanguageQuery,
          filter,
          examples,
        }) => ({
          queryId,
          naturalLanguageQuery,
          filter,
          relevantDocumentId: _.find(examples, ({ relevance }) => relevance === 10).document_id,
        }),
      )
        .filter(({ relevantDocumentId }) => !!relevantDocumentId)
        .value();
    },
  },
  {
    title: 'Filtering notices by keeping ones with relevant macros and removing duplicates',
    task: async ctx => {
      ctx.notices = _(ctx.notices)
        // find and save query used for this request with notice
        .map(notice => {
          notice.query = _.find(ctx.queries, ({ queryId }) => queryId === notice.queryId);

          return notice;
        })
        .filter(({ query }) => !!query)
        .uniqBy(({ query: { relevantDocumentId } }) => relevantDocumentId)
        .value();
    },
  },
  {
    title: 'Getting document titles',
    task: async ctx => {
      const documentIds = _.map(ctx.notices, ({ query: { relevantDocumentId } }) => relevantDocumentId);

      const dbDocuments = await DiscoveryDocument.findAll({
        where: {
          discoveryId: {
            [Op.in]: documentIds,
          },
        },
      });

      const documents = toPlain(dbDocuments);

      ctx.notices = _.map(ctx.notices, notice => {
        const noticeDocument = _.find(
          documents,
          ({ discoveryId }) => discoveryId === notice.query.relevantDocumentId,
        ) || {};

        notice.document = {
          title: noticeDocument.title,
          text: noticeDocument.text,
        };

        return notice;
      });
    },
  },
  {
    title: `Saving relevant notices to tmp/${NOTICES_JSON_FILENAME}`,
    task: async ctx => {
      await saveJsonToTempFile(NOTICES_JSON_FILENAME, ctx.notices);
    },
  },
  {
    title: `Saving relevant notices to tmp/${NOTICES_CSV_FILENAME}`,
    task: async ctx => {
      const csv = json2csv({
        data: _.map(ctx.notices, ({ id, description, document, query, createdAt }) => ({
          'Notice ID': id,
          'Notice Description': description,
          'Used Query': query.naturalLanguageQuery,
          'Used Filter': query.filter,
          'Macro Title': document.title,
          'Macro Text': document.text,
          'Created at': createdAt,
        })),
      });

      await writeTmpFile(NOTICES_CSV_FILENAME, csv);
    },
  },
]);

const run = async () => {
  try {
    const { notices } = await tasks.run();

    logger.info(`Total number of notices is ${_.size(notices)}`);
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();
