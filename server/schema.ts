import { gql } from 'apollo-server-koa';

export const typeDefs = gql`
scalar Date
scalar Time
scalar DateTime

type Query {
  allDocuments: [Document]

  documentsByCollection(
    discoveryCollectionId: String
  ): [Document]

  suggestedEntities(
    text: String
    clientId: String
    type: String
  ): [Entity]

  allClients: [Client]

  client(
    id: String
  ): Client

  allCollections: [Collection]

  allShortcuts(
    clientId: String
  ): [Entity]

  collectionTrainingStatus(
    collectionId: String
  ): JobStatus

  zendeskDataImportStatus(
    clientId: String
  ): JobStatus

  searchedMacros(
    query: String
    clientId: String
    highlightClassName: String
  ): [Entity]

  searchedShortcuts(
    query: String
    clientId: String
    highlightClassName: String
  ): [Entity]

  collectionStatistics(
    id: String
    type: CollectionType = "macros"
  ): CollectionStatistic

  collectionDetails(
    id: String!
  ): CollectionDetails

  collectionTraining(
    id: String!
  ): [CollectionTrainingPair]
}

type Mutation {
  signup(
    email: String!
    password: String!
  ): User

  addClient(
    name: String!
    description: String
    discoveryUsername: String
    discoveryPassword: String
    discoveryApiKey: String
    discoveryUrl: String!
    discoveryEnvironmentId: String!
    discoveryConfigurationId: String!
    createDiscoveryCollection: Boolean
    discoveryCollectionId: String
    createShortcutsDiscoveryCollection: Boolean
    shortcutsDiscoveryCollectionId: String
    nluUsername: String
    nluPassword: String
    nluApiKey: String
    nluModelId: String
    zendeskDomain: String!
    zendeskUsername: String!
    zendeskApiToken: String!
    zendeskChatPassword: String
    zendeskChatApiToken: String
  ): Client

  removeClient(
    id: String
    removeDiscoveryCollections: Boolean = false
  ): String

  trainCollection(
    id: String
    skipTraining: Boolean
    useTranslit: Boolean
  ): String

  stopCollectionTraining(id: String): String
  resetCollectionTraining(id: String): String

  importZendeskData(
    id: String
  ): String

  resetZendeskDataImport(id: String): String

  updateDiscoveryDocument(
    id: String
    applyAutomation: Boolean
    submitAutomation: Boolean
    disableSubmitButton: Boolean
  ): Document
}

type Subscription {
  collectionTrainingStatus(
    collectionId: String
  ): JobStatus

  zendeskDataImportStatus(
    clientId: String
  ): JobStatus
}

type Document {
  id: String
  title: String
  zendeskMacroId: String
  zendeskShortcutId: String
  applyAutomation: Boolean
  submitAutomation: Boolean
  disableSubmitButton: Boolean
  trainingResults: [TrainingResult]
}

type Entity {
  id: String
  title: String
  text: String
  zendeskMacroId: String
  zendeskShortcutId: String
  zendeskShortcutTags: [String]
  highlightedTitle: String
  highlightedText: String
  highlightedFields: [String]
}

type Client {
  id: String
  name: String
  description: String
  discoveryUsername: String
  discoveryPassword: String
  discoveryApiKey: String
  discoveryUrl: String
  discoveryEnvironmentId: String
  discoveryConfigurationId: String
  createDiscoveryCollection: Boolean
  discoveryCollectionId: String
  createShortcutsDiscoveryCollection: Boolean
  shortcutsDiscoveryCollectionId: String
  nluUsername: String
  nluPassword: String
  nluApiKey: String
  nluModelId: String
  zendeskDomain: String
  zendeskUsername: String
  zendeskApiToken: String
  zendeskChatPassword: String
  zendeskChatApiToken: String
  collections: [Collection]
  createdAt: String
}

type Collection {
  id: String
  name: String
  description: String
  clientId: String
  type: String
  discoveryId: String
  documents: [Document]
}

type JobStatusSubstep {
  label: String
}

type JobStatusStep {
  label: String
  output: String
  type: String
  substeps: [JobStatusSubstep]
}

type JobStatus {
  steps: [JobStatusStep]
  error: String
  started: Boolean
  ended: Boolean
  offed: Boolean
}

type Shortcut {
  id: String
  title: String
  text: String
}

type User {
  email: String
  password: String
}

type CollectionStatistic {
  entitiesInZendesk: Int
  entitiesInDiscovery: Int
}

type CollectionDetails {
  id: String
  name: String
  type: String
  client: Client
  documents: [Document]
  trainings: [Training]
}

type Training {
  id: String
  trainedAt: DateTime
  discoveryCollectionId: String
  trainingResults: [TrainingResult]
}

type TrainingResult {
  id: String
  rankBeforeTraining: Int
  rankAfterTraining: Int
  scoreBeforeTraining: Float
  scoreAfterTraining: Float
  discoveryDocumentId: String
  zendeskTicketId: String
  trainingId: String
}

enum CollectionType {
  macros
  shortcuts
}

type CollectionTraining {
  dataUpdated: String
  totalExamples: Int
  sufficientLabelDiversity: Boolean
  processing: Boolean
  minimumExamplesAdded: Boolean
  successfullyTrained: String
  available: Boolean
  notices: Int
  minimumQueriesAdded: Boolean
}

type CollectionTrainingPair {
  label: String
  value: String
}
`;
