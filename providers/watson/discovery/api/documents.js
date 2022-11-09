const { promisify } = require('util');
const rawClient = require('../rawClient');
const createClient = require('../client');
const { services: { watson: { discovery: discoveryConfig } } } = require('../../../../config');

/**
 * Adds new document to collection.
 *
 * @param  {Object} document              Document to be inserted.
 * @param  {String} options.environmentId Environment ID.
 * @param  {String} options.collectionId  Collection ID.
 * @return {Promise}
 */
exports.add = async (document, {
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersionDate = discoveryConfig.apiVersionDate,
} = {}) => {
  const client = createClient({
    apiKey,
    url,
    apiVersionDate,
  });

  return promisify(client.addJsonDocument.bind(client))({
    environment_id: environmentId,
    collection_id: collectionId,
    file: document,
  });
};

/**
 * Updates existing document in collection.
 *
 * @param  {String} documentId            The ID of the document to be updated.
 * @param  {Object} documentFields        The fields of the document to be updated.
 * @param  {String} options.environmentId Environment ID.
 * @param  {String} options.collectionId  Collection ID.
 * @return {Promise}
 */
exports.update = async (documentId, documentFields, {
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersionDate = discoveryConfig.apiVersionDate,
} = {}) => {
  const client = createClient({
    apiKey,
    url,
    apiVersionDate,
  });

  return promisify(client.updateJsonDocument.bind(client))({
    document_id: documentId,
    environment_id: environmentId,
    collection_id: collectionId,
    file: documentFields,
  });
};

/**
 * Deletes document from collection.
 *
 * @param  {String} documentId            ID of document to be listed.
 * @param  {String} options.environmentId Environment ID.
 * @param  {String} options.collectionId  Collection ID.
 * @return {Promise}
 */
exports.delete = async (documentId, {
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const { data } = await rawClient.delete(
    `environments/${environmentId}/collections/${collectionId}/documents/${documentId}`,
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

/**
 * Lists document details.
 *
 * @param  {String} documentId            ID of document to be listed.
 * @param  {String} options.environmentId Environment ID.
 * @param  {String} options.collectionId  Collection ID.
 * @return {Promise}
 */
exports.listDetails = async (documentId, {
  environmentId,
  collectionId,
  apiKey,
  url,
  apiVersion = discoveryConfig.apiVersion,
} = {}) => {
  const { data } = await rawClient.get(
    `environments/${environmentId}/collections/${collectionId}/documents/${documentId}`,
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

exports.count = async ({
  collectionId,
  environmentId,
  apiKey,
  url,
  apiVersionDate = discoveryConfig.apiVersionDate,
} = {}) => {
  const client = createClient({
    apiKey,
    url,
    apiVersionDate,
  });
  const getAvailable = () => new Promise((resolve, reject) => {
    client.getCollection(
      {
        environment_id: environmentId,
        collection_id: collectionId,
      },
      (error, data) => {
        if (!data || !data.document_counts) {
          return resolve(0);
        }

        if (error) {
          return reject(error);
        }

        return resolve(data.document_counts.available);
      },
    );
  });

  return getAvailable();
};
