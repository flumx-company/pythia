const { UUID, UUIDV4, TEXT, BOOLEAN } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('discoveryDocument', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  title: {
    type: TEXT,
  },
  text: {
    type: TEXT,
  },
  discoveryId: {
    type: TEXT,
    unique: true,
  },
  applyAutomation: {
    type: BOOLEAN,
  },
  submitAutomation: {
    type: BOOLEAN,
  },
  disableSubmitButton: {
    type: BOOLEAN,
  },
});
