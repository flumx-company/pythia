const { map } = require('blend-promise-utils');

const COLUMN_NAME = 'zendeskId';

const data = [{
  table: 'zendeskTicketForms',
  constraint: 'ticketForms_zendeskId_key',
}, {
  table: 'zendeskTickets',
  constraint: 'tickets_zendeskId_key',
}, {
  table: 'zendeskTicketAudits',
  constraint: 'ticketAudits_zendeskId_key',
}, {
  table: 'zendeskTicketAuditEvents',
  constraint: 'ticketAuditEvents_zendeskId_key',
}, {
  table: 'zendeskMacros',
  constraint: 'zendeskMacros_zendeskId_key',
}, {
  table: 'zendeskDynamicContentItems',
  constraint: 'zendeskDynamicContentItems_zendeskId_key',
}];

module.exports = {
  up: async queryInterface => {
    await map(data, ({ table, constraint }) => queryInterface.removeConstraint(table, constraint));
  },

  down: async queryInterface => {
    await map(data, ({ table, constraint }) => queryInterface.addConstraint(table, [COLUMN_NAME], {
      type: 'UNIQUE',
      name: constraint,
    }));
  },
};
