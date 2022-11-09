const { UUID, UUIDV4, DATE, TEXT, ARRAY, BIGINT } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskTicket', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  subject: {
    type: TEXT,
  },
  type: {
    type: TEXT,
  },
  description: {
    type: TEXT,
  },
  tags: {
    type: ARRAY(TEXT),
  },
  zendeskId: {
    type: BIGINT,
    unique: true,
  },
  zendeskCreatedAt: {
    type: DATE,
  },
});
