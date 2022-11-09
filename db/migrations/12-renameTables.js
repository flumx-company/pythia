const _ = require('lodash');

const updates = [
  ['collections', 'discoveryCollections'],
  ['documents', 'discoveryDocuments'],
  ['tickets', 'zendeskTickets'],
  ['ticketForms', 'zendeskTicketForms'],
  ['ticketAudits', 'zendeskTicketAudits'],
  ['ticketAuditEvents', 'zendeskTicketAuditEvents'],
];

module.exports = {
  up: async queryInterface => {
    await Promise.all(
      _.map(updates, ([oldName, newName]) => queryInterface.renameTable(
        oldName,
        newName,
      )),
    );
  },

  down: async queryInterface => {
    await Promise.all(
      _.map(updates, ([oldName, newName]) => queryInterface.renameTable(
        newName,
        oldName,
      )),
    );
  },
};
