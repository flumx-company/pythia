const { UUID, UUIDV4, TEXT, BOOLEAN, DATE, ENUM } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('discoveryCollection', {
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
  discoveryId: {
    type: TEXT,
    unique: true,
  },
  nluModelId: {
    type: TEXT,
  },
  isDefault: {
    type: BOOLEAN,
    defaultValue: false,
  },
  type: {
    type: ENUM,
    values: ['macros', 'shortcuts'],
    defaultValue: 'macros',
  },
  isBeingTrained: {
    type: BOOLEAN,
    defaultValue: false,
  },
  lastTrainedAt: {
    type: DATE,
  },
});
