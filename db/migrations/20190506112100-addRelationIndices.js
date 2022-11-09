const { map } = require('blend-promise-utils');

const data = [{
  table: 'zendeskTicketAuditEvents',
  column: 'zendeskTicketAuditId',
  index: 'zendeskTicketAuditEvents_zendeskTicketAuditId',
}, {
  table: 'zendeskTicketAudits',
  column: 'zendeskTicketId',
  index: 'zendeskTicketAudits_zendeskTicketId',
}];

module.exports = {
  up: async queryInterface => {
    await map(data, ({ table, column, index }) => queryInterface.addIndex(
      table,
      {
        fields: [column],
        name: index,
      },
    ));
  },

  down: async queryInterface => {
    await map(data, ({ table, index }) => queryInterface.removeIndex(
      table,
      index,
    ));
  },
};
