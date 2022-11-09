const { UUID, UUIDV4, BIGINT, DATE } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskTicketAudit', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  zendeskId: {
    type: BIGINT,
    unique: true,
  },
  zendeskAuthorId: {
    type: BIGINT,
  },
  zendeskCreatedAt: {
    type: DATE,
  },
});
