const { UUID, UUIDV4, DATE, TEXT, BIGINT, INTEGER, BOOLEAN, JSONB } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskMacro', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  title: {
    type: TEXT,
  },
  description: {
    type: TEXT,
  },
  active: {
    type: BOOLEAN,
  },
  // TODO: change to ARRAY(JSONB)
  actions: {
    type: JSONB,
  },
  position: {
    type: INTEGER,
  },
  restriction: {
    type: JSONB,
  },
  zendeskId: {
    type: BIGINT,
    unique: true,
  },
  zendeskCreatedAt: {
    type: DATE,
  },
});
