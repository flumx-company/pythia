const TABLE_NAME = 'clients';
const COLUMN_OLD_NAME = 'zendeskPassword';
const COLUMN_NEW_NAME = 'zendeskChatPassword';

module.exports = {
  up: async queryInterface => {
    await queryInterface.renameColumn(
      TABLE_NAME,
      COLUMN_OLD_NAME,
      COLUMN_NEW_NAME,
    );
  },

  down: async queryInterface => {
    await queryInterface.renameColumn(
      TABLE_NAME,
      COLUMN_NEW_NAME,
      COLUMN_OLD_NAME,
    );
  },
};
