const { UUID, UUIDV4, DATE, TEXT, BIGINT, INTEGER, BOOLEAN, JSONB, ARRAY } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskDynamicContentItem', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  name: {
    type: TEXT,
  },
  placeholder: {
    type: TEXT,
  },
  defaultLocaleId: {
    type: INTEGER,
  },
  outdated: {
    type: BOOLEAN,
  },
  zendeskCreatedAt: {
    type: DATE,
  },
  variants: {
    type: ARRAY(JSONB),
  },
  zendeskId: {
    type: BIGINT,
    unique: true,
  },
});
