const _ = require('lodash');

const TABLE_NAME = 'discoveryDocuments';
const COLUMN_KEY = ['applyAutomation', 'submitAutomation', 'disableSubmitButton'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await Promise.all(
        _.map(COLUMN_KEY, async columnName => {
          await queryInterface.addColumn(TABLE_NAME, columnName, {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          });
        }),
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err.message);
    }
  },

  down: async queryInterface => {
    _.map(COLUMN_KEY.reverse(), async columnName => {
      await queryInterface.removeColumn(TABLE_NAME, columnName);
    });
  },
};
