const TABLE_NAME = 'trainings';
const COLUMN_KEY = 'useTranslit';
const COLUMN_TYPE_KEY = 'BOOLEAN';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_KEY,
      Sequelize[COLUMN_TYPE_KEY],
      {
        defaultValue: false,
      },
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
