const TABLE_NAME = 'clients';
const COLUMN_KEY = 'zendeskChatApiToken';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_KEY,
      {
        type: Sequelize.STRING,
        defaultValue: null,
      },
    );
  },

  down: async queryInterface => {
    await queryInterface.removeColumn(
      TABLE_NAME,
      COLUMN_KEY,
    );
  },
};
