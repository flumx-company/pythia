// const _ = require('lodash');
const { map } = require('blend-promise-utils');

const TABLE_NAMES = ['zendeskTicketAudits', 'zendeskTicketAuditEvents'];
const COLUMN_NAME = 'clientId';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await map(TABLE_NAMES, table => queryInterface.addColumn(
      table,
      COLUMN_NAME,
      {
        type: Sequelize.UUID,
        references: {
          model: 'clients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    ));
  },

  down: async queryInterface => {
    await map(TABLE_NAMES, table => queryInterface.removeColumn(
      table,
      COLUMN_NAME,
    ));
  },
};
