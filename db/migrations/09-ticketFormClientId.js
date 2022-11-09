const TABLE_NAME = 'ticketForms';
const COLUMN_KEY = 'clientId';
const COLUMN_TYPE_KEY = 'TEXT';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_KEY,
      Sequelize[COLUMN_TYPE_KEY],
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      TABLE_NAME,
      COLUMN_KEY,
      Sequelize[COLUMN_TYPE_KEY],
    );
  },
};
