// const _ = require('lodash');
const { map } = require('blend-promise-utils');

const TABLE_NAME = 'discoveryDocuments';
const COLUMN_NAMES = ['zendeskMacroId', 'zendeskShortcutId'];

module.exports = {
  up: async queryInterface => {
    try {
      await map(COLUMN_NAMES, column => queryInterface.removeColumn(
        TABLE_NAME,
        column,
      ));
    } catch (err) {
      // no error
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await map(COLUMN_NAMES, column => queryInterface.addColumn(
        TABLE_NAME,
        column,
        {
          type: Sequelize.TEXT,
        },
      ));
    } catch (err) {
      // no error
    }
  },
};
