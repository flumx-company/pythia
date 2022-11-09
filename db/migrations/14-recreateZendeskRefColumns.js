const _ = require('lodash');
const { BIGINT, UUID } = require('sequelize');

const updates = [
  ['zendeskTicketAudits', 'zendeskTicketId', BIGINT, UUID],
  ['zendeskTickets', 'zendeskTicketFormId', BIGINT, UUID],
];

module.exports = {
  up: async queryInterface => {
    await Promise.all(
      _.map(updates, async ([tableName, columnName,, newType]) => {
        await queryInterface.removeColumn(
          tableName,
          columnName,
        );
        await queryInterface.addColumn(
          tableName,
          columnName,
          newType,
        );
      }),
    );
  },

  down: async queryInterface => {
    await Promise.all(
      _.map(updates, async ([tableName, columnName, oldType]) => {
        await queryInterface.removeColumn(
          tableName,
          columnName,
        );
        await queryInterface.addColumn(
          tableName,
          columnName,
          oldType,
        );
      }),
    );
  },
};
