import _ from 'lodash';
import {
  GraphQLDate,
  GraphQLTime,
  GraphQLDateTime,
} from 'graphql-iso-date';

import allDocuments from '@/server/api/queries/allDocuments';
import documentsByCollection from '@/server/api/queries/documentsByCollection';
import allCollections from '@/server/api/queries/allCollections';
import allClients from '@/server/api/queries/allClients';
import client from '@/server/api/queries/client';
import allShortcuts from '@/server/api/queries/allShortcuts';
import suggestedEntities from '@/server/api/queries/suggestedEntities';
import searchedMacros from '@/server/api/queries/searchedMacros';
import searchedShortcuts from '@/server/api/queries/searchedShortcuts';
import collectionDetails from '@/server/api/queries/collectionDetails';
import collectionStatistics from '@/server/api/queries/collectionStatistics';
import collectionTraining from '@/server/api/queries/collectionTraining';
import collectionTrainingStatusQuery from '@/server/api/queries/collectionTrainingStatus';
import zendeskDataImportStatusQuery from '@/server/api/queries/zendeskDataImportStatus';

import addClient from '@/server/api/mutations/addClient';
import removeClient from '@/server/api/mutations/removeClient';
import trainCollection from '@/server/api/mutations/trainCollection';
import stopCollectionTraining from '@/server/api/mutations/stopCollectionTraining';
import resetCollectionTraining from '@/server/api/mutations/resetCollectionTraining';
import updateDiscoveryDocument from '@/server/api/mutations/updateDiscoveryDocument';
import importZendeskData from '@/server/api/mutations/importZendeskData';
import resetZendeskDataImport from '@/server/api/mutations/resetZendeskDataImport';

import collectionTrainingStatus from '@/server/api/subscriptions/collectionTrainingStatus';
import zendeskDataImportStatus from '@/server/api/subscriptions/zendeskDataImportStatus';

export default {
  Query: {
    allDocuments,
    documentsByCollection,
    allCollections,
    allClients,
    client,
    allShortcuts,
    suggestedEntities,
    searchedMacros,
    searchedShortcuts,
    collectionDetails,
    collectionStatistics,
    collectionTraining,
    collectionTrainingStatus: collectionTrainingStatusQuery,
    zendeskDataImportStatus: zendeskDataImportStatusQuery,
  },

  Mutation: {
    addClient,
    removeClient,
    trainCollection,
    stopCollectionTraining,
    resetCollectionTraining,
    updateDiscoveryDocument,
    importZendeskData,
    resetZendeskDataImport,
  },

  Subscription: {
    collectionTrainingStatus,
    zendeskDataImportStatus,
  },

  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
};
