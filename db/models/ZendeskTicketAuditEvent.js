const { UUID, UUIDV4, TEXT, BIGINT, JSONB } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskTicketAuditEvent', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  type: {
    type: TEXT,
  },
  body: {
    type: TEXT,
  },
  value: {
    type: JSONB,
  },
  previousValue: {
    type: JSONB,
  },
  fieldName: {
    type: TEXT,
  },
  macroId: {
    type: BIGINT,
  },
  zendeskId: {
    type: BIGINT,
    unique: true,
  },
});
