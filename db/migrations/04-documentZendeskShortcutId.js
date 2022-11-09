const TABLE_NAME = 'documents';
const COLUMN_KEY = 'zendeskShortcutId';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_KEY,
      Sequelize.TEXT,
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      TABLE_NAME,
      COLUMN_KEY,
      Sequelize.TEXT,
    );
  },
};
