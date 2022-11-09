const TABLE_NAME = 'zendeskShortcuts';
const COLUMN_NAME = 'zendeskId';
const CONSTRAINT_NAME = 'zendeskShortcuts_zendeskId_key';

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeConstraint(TABLE_NAME, CONSTRAINT_NAME);
  },

  down: async queryInterface => {
    await queryInterface.addConstraint(TABLE_NAME, [COLUMN_NAME], {
      type: 'UNIQUE',
      name: CONSTRAINT_NAME,
    });
  },
};
