const { UUID, UUIDV4, DATE, BOOLEAN } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('training', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  useTranslit: {
    type: BOOLEAN,
    defaultValue: false,
  },
  trainedAt: {
    type: DATE,
  },
});
