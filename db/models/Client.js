const { UUID, UUIDV4, TEXT } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('client', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  name: {
    type: TEXT,
  },
  description: {
    type: TEXT,
  },
  zendeskDomain: {
    type: TEXT,
    unique: true,
  },
  zendeskUsername: {
    type: TEXT,
  },
  zendeskApiToken: {
    type: TEXT,
  },
  zendeskChatPassword: {
    type: TEXT,
  },
  zendeskChatApiToken: {
    type: TEXT,
  },
  discoveryEnvironmentId: {
    type: TEXT,
  },
  discoveryConfigurationId: {
    type: TEXT,
  },
  discoveryUsername: {
    type: TEXT,
  },
  discoveryPassword: {
    type: TEXT,
  },
  discoveryApiKey: {
    type: TEXT,
  },
  discoveryUrl: {
    type: TEXT,
  },
  nluUsername: {
    type: TEXT,
  },
  nluPassword: {
    type: TEXT,
  },
  nluApiKey: {
    type: TEXT,
  },
});
