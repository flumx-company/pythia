const TABLE_NAME = 'clients';
const COLUMN_KEY = 'discoveryApiKey';
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
