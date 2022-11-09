const { UUID, UUIDV4, TEXT, ARRAY } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('zendeskShortcut', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  name: {
    type: TEXT,
  },
  message: {
    type: TEXT,
  },
  scope: {
    type: TEXT,
  },
  agents: {
    type: ARRAY(TEXT),
  },
  departments: {
    type: ARRAY(TEXT),
  },
  options: {
    type: TEXT,
  },
  tags: {
    type: ARRAY(TEXT),
  },
  zendeskId: {
    type: TEXT,
  },
});
