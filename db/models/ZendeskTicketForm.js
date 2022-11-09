const { UUID, UUIDV4, INTEGER, BIGINT, DATE, TEXT, BOOLEAN, ARRAY } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskTicketForm', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  name: {
    type: TEXT,
  },
  position: {
    type: INTEGER,
  },
  active: {
    type: BOOLEAN,
  },
  default: {
    type: BOOLEAN,
  },
  ticketFieldIds: {
    type: ARRAY(BIGINT),
  },
  zendeskId: {
    type: BIGINT,
    unique: true,
  },
  zendeskCreatedAt: {
    type: DATE,
  },
});
