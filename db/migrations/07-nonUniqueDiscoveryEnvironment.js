const TABLE_NAME = 'clients';
const INDEX_NAME = 'clients_discoveryEnvironmentId_key';

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeConstraint(
      TABLE_NAME,
      INDEX_NAME,
    );
  },

  down: async queryInterface => {
    await queryInterface.addConstraint(
      TABLE_NAME,
      INDEX_NAME,
    );
  },
};
