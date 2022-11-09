const TABLE_NAME = 'collections';
const COLUMN_KEY = 'type';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_KEY,
      {
        type: Sequelize.ENUM('macros', 'shortcuts'),
        defaultValue: 'macros',
      },
    );

    await queryInterface.upsert(
      TABLE_NAME,
    );
  },

  down: async queryInterface => {
    await queryInterface.removeColumn(
      TABLE_NAME,
      COLUMN_KEY,
    );
  },
};
