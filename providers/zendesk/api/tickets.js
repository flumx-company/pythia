const { request } = require('../helpers/request');

exports.list = (query, params) => request('get', 'tickets', query, params);

exports.listForms = (query, params) => request('get', 'ticket_forms', query, params);

exports.listAudits = (query, params) => request('get', 'ticket_audits', query, params);

exports.listAuditsForTicket = (ticketId, params) => request('get', `tickets/${ticketId}/audits`, null, params);

exports.getAuditById = (ticketId, auditId, params) => (
  request('get', `tickets/${ticketId}/audits/${auditId}`, null, params)
);
