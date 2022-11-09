const { UUID, UUIDV4, INTEGER, NUMERIC } = require('sequelize');
const sequelize = require('../sequelize');

module.exports = sequelize.define('trainingResult', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  rankBeforeTraining: {
    type: INTEGER,
  },
  rankAfterTraining: {
    type: INTEGER,
  },
  scoreBeforeTraining: {
    type: NUMERIC,
  },
  scoreAfterTraining: {
    type: NUMERIC,
  },
});
