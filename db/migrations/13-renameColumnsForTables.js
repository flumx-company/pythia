const _ = require('lodash');

const updates = [
  ['zendeskTickets', 'documentId', 'discoveryDocumentId'],
  ['zendeskTicketAuditEvents', 'ticketAuditId', 'zendeskTicketAuditId'],
  ['discoveryDocuments', 'collectionId', 'discoveryCollectionId'],
];

module.exports = {
  up: async queryInterface => {
    await Promise.all(
      _.map(updates, ([tableName, oldName, newName]) => queryInterface.renameColumn(
        tableName,
        oldName,
        newName,
      )),
    );
  },

  down: async queryInterface => {
    await Promise.all(
      _.map(updates, ([tableName, oldName, newName]) => queryInterface.renameColumn(
        tableName,
        newName,
        oldName,
      )),
    );
  },
};
