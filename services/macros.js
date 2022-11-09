// XXX: find a better name for the service
const _ = require('lodash');
const json2csv = require('json2csv');
const logger = require('../helpers/logger');
const zendesk = require('../providers/zendesk');
const discovery = require('../providers/watson/discovery');
const { cleanText } = require('../helpers/cleaner');
const { writeTmpFile } = require('../helpers/file');
const { delay } = require('../helpers/misc');
const { translit } = require('../helpers/misc');
const { DiscoveryDocument } = require('../db/models');
const { services: { zendesk: zendeskConfig } } = require('../config');
const {
  // exclude: {
  //   macroTitles: macroTitlesToExclude,
  // },
  clean: {
    ticketComments: ticketCommentJunk,
  },
} = require('../enums/filters');

const MACROS_CSV_FILENAME = 'macros.csv';

exports.createCollection = async name => {
  const { collection_id: collectionId } = await discovery.collections.create({
    name,
  });

  return collectionId;
};

exports.getAll = async ({
  username = zendeskConfig.username,
  token = zendeskConfig.token,
  url = zendeskConfig.url,
} = {}) => {
  let totalMacros = [];

  const listMacros = async (page = 1) => {
    const result = await zendesk.macros.list({
      active: true,
      page,
    }, {
      username,
      token,
      url,
    });

    totalMacros = _.concat(totalMacros, result.macros);

    if (result.nextPage) {
      await listMacros(page + 1);
    }
  };

  await listMacros();

  return totalMacros;
};

exports.getCommentFromActions = (macro, { filter = true } = {}) => {
  if (!macro || !macro.actions) {
    return null;
  }

  const commentValueAction = _.find(
    macro.actions,
    ({ field }) => field === 'comment_value' || field === 'comment_value_html',
  );

  let text;

  if (_.isObject(commentValueAction)) {
    if (_.isArray(commentValueAction.value)) {
      text = commentValueAction.value[1];

      if (filter) {
        text = cleanText(text, ticketCommentJunk);
      }
    } else if (_.isString(commentValueAction.value)) {
      text = commentValueAction.value;

      if (filter) {
        text = cleanText(text, ticketCommentJunk);
      }
    }
  }

  return text || null;
};

exports.process = (macros, {
  useTranslit = false,
  filter = true,
} = {}) => _(macros)
  .compact()
  // .filter(({ title }) => (filter ? !_.includes(macroTitlesToExclude, title) : true))
  .map(macro => {
    const text = exports.getCommentFromActions(macro, { filter });
    const { id, title, zendeskId } = macro;

    return {
      id,
      zendeskId,
      title: useTranslit ? translit(title) : title,
      text: useTranslit ? translit(text) : text,
    };
  })
  .filter('text')
  .value();

exports.exportToCSV = async macros => {
  try {
    const csv = json2csv({ data: _.map(macros, ({ title, text }) => ({ title, text })) });

    return writeTmpFile(MACROS_CSV_FILENAME, csv);
  } catch (err) {
    throw new Error(err);
  }
};

exports.deleteDocuments = async ({
  collectionId,
  environmentId,
  username = null,
  password = null,
  apiKey,
  url,
  task = {},
  queue = 10,
} = {}) => {
  const { results } = await discovery.collections.query({
    query: '',
    count: 10000,
    collectionId,
    environmentId,
    username,
    password,
    apiKey,
    url,
  });

  const totalDocumentCount = _.size(results);
  let deletedDocumentCount = 0;
  const chunks = _.chunk(results, queue);

  for (const chunk of chunks) {
    _.map(chunk, async ({ id }) => {
      try {
        await discovery.documents.delete(id, {
          collectionId,
          environmentId,
          username,
          password,
          apiKey,
          url,
        });

        await DiscoveryDocument.destroy({
          where: {
            discoveryId: id,
          },
        });

        task.output = `${++deletedDocumentCount} of ${totalDocumentCount} deleted.`;
      } catch (err) {
        logger.error(err);
      }
    });
  }
};

const uploadEntities = async (entities, {
  environmentId,
  collectionId,
  username,
  password,
  apiKey,
  url,
  dbCollectionId,
  task,
  queue,
  titleFieldName,
  textFieldName,
  customFields = [],
  saveToDatabase,
} = {}) => {
  const chunks = _.chunk(entities, queue);
  const totalMacrosCount = _.size(entities);
  let totalUploadedCount = 0;

  const checkDocumentUploaded = async id => {
    try {
      const {
        status,
        document_id: documentId,
      } = await discovery.documents.listDetails(
        id,
        {
          collectionId,
          environmentId,
          username,
          password,
          apiKey,
          url,
        },
      );

      if (_.includes(['available', 'available with notices', 'active'], status)) {
        task.output = `${++totalUploadedCount}/${totalMacrosCount} uploaded.`;
        return documentId;
      }

      await delay(3000);
      await checkDocumentUploaded(id);
    } catch (err) {
      task.output = `${++totalUploadedCount}/${totalMacrosCount} uploaded.`;
      logger.error(err);
      await delay(3000);
      await checkDocumentUploaded(id);
    }
  };

  for (const chunk of chunks) {
    const processingDocuments = await Promise.all(
      _.map(chunk, async entity => {
        const [title, text] = [entity[titleFieldName], entity[textFieldName]];
        // create from array e.g.
        // [ ['zendeskMacroId', 'id'] ]
        // object
        // {
        //    zendeskMacroId: <id>
        // }
        const customFieldsObject = _.mapValues(_.fromPairs(customFields), value => entity[value]);

        try {
          const { document_id: documentId } = await discovery.documents.add({
            title,
            text,
            ...customFieldsObject,
          }, {
            environmentId,
            collectionId,
            username,
            password,
            apiKey,
            url,
          });

          if (saveToDatabase) {
            await DiscoveryDocument.create({
              title,
              text,
              discoveryCollectionId: dbCollectionId,
              discoveryId: documentId,
              ...customFieldsObject,
            });
          }

          return documentId;
        } catch (err) {
          logger.error(err);
        }
      }),
    );

    await Promise.all(
      _.map(processingDocuments, async documentId => checkDocumentUploaded(documentId)),
    );
  }

  return totalUploadedCount;
};

exports.uploadMacros = async (macros, {
  environmentId,
  // native collection
  collectionId,
  // database collection
  dbCollectionId,
  apiKey,
  url,
  task = {},
  queue,
  titleFieldName = 'title',
  textFieldName = 'text',
  customFields = [
    ['zendeskMacroId', 'id'],
  ],
  saveToDatabase = true,
} = {}) => uploadEntities(macros, {
  environmentId,
  collectionId,
  dbCollectionId,
  apiKey,
  url,
  task,
  queue,
  titleFieldName,
  textFieldName,
  customFields,
  saveToDatabase,
});

exports.uploadShortcuts = async (shortcuts, {
  environmentId,
  collectionId,
  dbCollectionId,
  apiKey,
  url,
  task = {},
  queue,
  titleFieldName = 'name',
  textFieldName = 'message',
  customFields = [
    ['zendeskShortcutId', 'id'],
  ],
  saveToDatabase = true,
} = {}) => uploadEntities(shortcuts, {
  environmentId,
  collectionId,
  dbCollectionId,
  apiKey,
  url,
  task,
  queue,
  titleFieldName,
  textFieldName,
  customFields,
  saveToDatabase,
});
