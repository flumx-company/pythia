const ZendeskTicket = require('./models/ZendeskTicket');
const ZendeskTicketForm = require('./models/ZendeskTicketForm');
const ZendeskTicketAudit = require('./models/ZendeskTicketAudit');
const ZendeskTicketAuditEvent = require('./models/ZendeskTicketAuditEvent');
const DiscoveryDocument = require('./models/DiscoveryDocument');
const DiscoveryCollection = require('./models/DiscoveryCollection');
const Client = require('./models/Client');
const Training = require('./models/Training');
const TrainingResult = require('./models/TrainingResult');
const ZendeskMacro = require('./models/ZendeskMacro');
const ZendeskShortcut = require('./models/ZendeskShortcut');
const ZendeskDynamicContentItem = require('./models/ZendeskDynamicContentItem');

// XXX: make relation names consistent (e.g. 'zendeskTicketAudits' instead of 'audits')

Client.hasMany(DiscoveryCollection, { as: 'collections' });
Client.hasMany(ZendeskTicketForm, { as: 'zendeskTicketForms' });
Client.hasMany(ZendeskTicket, { as: 'zendeskTickets' });
Client.hasMany(ZendeskTicketAudit);
Client.hasMany(ZendeskTicketAuditEvent);
Client.hasMany(ZendeskMacro);
Client.hasMany(ZendeskShortcut);
Client.hasMany(ZendeskDynamicContentItem);

DiscoveryCollection.hasMany(DiscoveryDocument, { as: 'documents' });
DiscoveryCollection.hasMany(Training);
DiscoveryCollection.belongsTo(Client);

DiscoveryDocument.hasMany(ZendeskTicket, { as: 'zendeskTickets' });
DiscoveryDocument.hasMany(TrainingResult);
DiscoveryDocument.hasOne(ZendeskMacro);
DiscoveryDocument.hasOne(ZendeskShortcut);
DiscoveryDocument.belongsTo(DiscoveryCollection);

ZendeskTicket.hasMany(ZendeskTicketAudit, { as: 'audits' });
ZendeskTicket.hasMany(TrainingResult);
ZendeskTicket.belongsTo(ZendeskTicketForm);
ZendeskTicket.belongsTo(Client);
ZendeskTicket.belongsTo(DiscoveryDocument);

ZendeskTicketForm.hasMany(ZendeskTicket, { as: 'zendeskTickets' });
ZendeskTicketForm.belongsTo(Client);

ZendeskTicketAudit.hasMany(ZendeskTicketAuditEvent, { as: 'events' });
ZendeskTicketAudit.belongsTo(ZendeskTicket);
ZendeskTicketAudit.belongsTo(Client);

ZendeskTicketAuditEvent.belongsTo(ZendeskTicketAudit);
ZendeskTicketAuditEvent.belongsTo(Client);

Training.hasMany(TrainingResult);
Training.belongsTo(DiscoveryCollection);

TrainingResult.belongsTo(Training);
TrainingResult.belongsTo(DiscoveryDocument);
TrainingResult.belongsTo(ZendeskTicket);

ZendeskMacro.belongsTo(Client);
ZendeskMacro.belongsTo(DiscoveryDocument);

ZendeskShortcut.belongsTo(Client);
ZendeskShortcut.belongsTo(DiscoveryDocument);

ZendeskDynamicContentItem.belongsTo(Client);

module.exports = {
  Client,
  Training,
  TrainingResult,
  DiscoveryDocument,
  DiscoveryCollection,
  ZendeskTicket,
  ZendeskTicketForm,
  ZendeskTicketAudit,
  ZendeskTicketAuditEvent,
  ZendeskMacro,
  ZendeskShortcut,
  ZendeskDynamicContentItem,
};
