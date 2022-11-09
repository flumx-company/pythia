const _ = require('lodash');
const discovery = require('../providers/watson/discovery');
const zendesk = require('../providers/zendesk');
const {
  ZendeskTicket,
  ZendeskTicketAudit,
  ZendeskTicketForm,
  ZendeskTicketAuditEvent,
  DiscoveryDocument,
} = require('../db/models');
const { services: { zendesk: zendeskConfig } } = require('../config');
const logger = require('../helpers/logger');
const { toPlain } = require('../helpers/database');

let loadedTicketCount = 0;
let totalZendeskTicketCount;
let totalLocalTicketCount;

exports.importZendeskTicketFormsToDatabase = async ({
  clientId,
  token = zendeskConfig.token,
  url = zendeskConfig.url,
} = {}) => {
  let ticketFormsResponse = {};

  // logger.debug({
  //   username,
  //   token,
  //   url,
  // }, 'Importing Zendesk ticket forms to database.');

  try {
    ticketFormsResponse = await zendesk.tickets.listForms({}, {
      token,
      url,
    });
  } catch (err) {
    logger.error(err);
  }

  const { ticketForms } = ticketFormsResponse;

  if (!ticketForms) {
    logger.warn(ticketFormsResponse, 'Ticket forms have not been found.');
    return null;
  }

  return Promise.all(_.map(ticketForms, async ({
    id,
    name,
    position,
    active,
    ticket_field_ids: ticketFieldIds,
    default: isDefault,
    fcreated_at: zendeskCreatedAt,
  }) => {
    const ticketFormFields = {
      clientId,
      name,
      position,
      ticketFieldIds,
      active,
      default: isDefault,
      zendeskId: id,
      zendeskCreatedAt,
    };

    const dbTicketForm = await ZendeskTicketForm.findOne({
      where: {
        zendeskId: id,
      },
    });

    if (dbTicketForm) {
      return dbTicketForm.update(ticketFormFields);
    }

    return ZendeskTicketForm.create(ticketFormFields);
  }));
};

exports.importZendeskTicketsToDatabase = async ({
  clientId,
  ticketAuditQueueSize = 1000,
  ticketQueueSize = 5,
  ticketLimit = Infinity,
  zendeskAuditCursor = null,
  task = {},
  token = zendeskConfig.token,
  url = zendeskConfig.url,
  iteration = 1,
} = {}) => {
  logger.debug(`Importing Zendesk data to database. Iteration: ${iteration}. Cursor: ${zendeskAuditCursor}.`);

  let retries = 0;

  const getTotalZendeskTicketCount = async () => {
    try {
      const { count } = await zendesk.tickets.list(null, {
        token,
        url,
      });
      return count;
    } catch (err) {
      task.output = `${err.message}, retrying. Retries: ${++retries}`;
      await getTotalZendeskTicketCount();
    }
  };

  const listAudits = async () => zendesk.tickets.listAudits({
    include: ['tickets', 'users'],
    limit: ticketAuditQueueSize,
    cursor: zendeskAuditCursor,
  }, {
    token,
    url,
  });

  const getAudits = async () => {
    try {
      return await listAudits();
    } catch (err) {
      task.output = `${err.message}, retrying. Retries: ${++retries}`;
      await getAudits();
    }
  };

  const zendeskData = await getAudits();

  const ticketForms = toPlain(await ZendeskTicketForm.findOne({
    where: {
      clientId,
    },
  }));

  if (!totalZendeskTicketCount) {
    totalZendeskTicketCount = await getTotalZendeskTicketCount();

    if (totalZendeskTicketCount === 0) {
      return null;
    }

    if (ticketLimit > totalZendeskTicketCount) {
      ticketLimit = totalZendeskTicketCount;
    }
  }

  if (totalLocalTicketCount === undefined) {
    totalLocalTicketCount = await ZendeskTicket.count();
    // loadedTicketCount = totalLocalTicketCount;
  }

  if (!zendeskData) {
    // something has gone really wrong
    logger.error(`Zendesk data has not been received at ${zendeskAuditCursor} cursor, retrying.`);

    return exports.importZendeskTicketsToDatabase({
      ticketAuditQueueSize,
      ticketLimit,
      ticketQueueSize,
      zendeskAuditCursor,
      task,
    });
  }

  zendeskAuditCursor = zendeskData.beforeCursor;

  let tickets = _.map(zendeskData.tickets, ({
    url,
    id,
    type,
    subject,
    description,
    tags,
    created_at: zendeskCreatedAt,
    ticket_form_id: zendeskTicketFormId,
  }) => {
    const ticketAudits = _(zendeskData.audits)
      .filter(audit => audit.ticket_id === id)
      .map(audit => {
        const auditEvents = _.map(audit.events, event => ({
          type: event.type,
          body: _.isString(event.body) ? event.body : '',
          value: event.value,
          previousValue: event.previous_value,
          macroId: event.macro_id,
          fieldName: event.field_name,
          zendeskId: event.id,
        }));

        return {
          zendeskId: audit.id,
          zendeskAuthorId: audit.author_id,
          zendeskCreatedAt: audit.created_at,
          events: auditEvents,
        };
      })
      .value();

    const ticketForm = _.find(ticketForms, ({ zendeskId }) => zendeskTicketFormId === zendeskId);

    return {
      subject,
      type,
      description,
      tags,
      url,
      clientId,
      zendeskId: id,
      zendeskCreatedAt,
      zendeskTicketFormId: ticketForm && ticketForm.id,
      audits: ticketAudits,
    };
  });

  // do not go over ticket limit
  if ((loadedTicketCount + _.size(tickets)) > ticketLimit) {
    const excess = loadedTicketCount - ticketLimit;
    tickets = _.dropRight(tickets, excess);
  }

  // save to database with relations
  const include = [{
    model: ZendeskTicketAudit,
    as: 'audits',
    include: [{
      model: ZendeskTicketAuditEvent,
      as: 'events',
    }],
  }];

  // TODO: implement more performant database save
  // XXX: If facing 'JavaScript heap out of memory', error, check:
  // eslint-disable-next-line max-len
  // https://stackoverflow.com/questions/26094420/fatal-error-call-and-retry-last-allocation-failed-process-out-of-memory
  const processTicket = async ticket => {
    let dbTicket = await ZendeskTicket.findOne({
      where: {
        description: '123',
        // zendeskId: ticket.zendeskId,
      },
      include,
    });

    // if ticket is already in db, only add new audits
    if (dbTicket) {
      await Promise.all(
        _.map(ticket.audits, async audit => {
          // check if ticket audit has been already created
          const [dbTicketAudit, created] = await ZendeskTicketAudit.findOrCreate({
            where: { zendeskId: audit.zendeskId },
            defaults: audit,
          });

          // if ticket audit is not in db (i.e. created just now), add this audit to the ticket
          if (created) {
            await dbTicket.addAudit(dbTicketAudit);

            // add audit events to the audit as well
            const dbAuditEvents = await Promise.all(
              _.map(audit.events, async event => ZendeskTicketAuditEvent.create(event)),
            );

            await dbTicketAudit.setEvents(dbAuditEvents);
          }
        }),
      ).catch(err => logger.error(err && err.errors ? err.errors : err.message));

      return false;
    }

    try {
      dbTicket = await ZendeskTicket.create(ticket, { include });
    } catch (err) {
      return logger.error(err && err.errors ? err.errors : err.message);
    }

    // bind ticket to form if present
    if (ticket.zendeskTicketFormId) {
      const dbTicketForm = await ZendeskTicketForm.findOne({
        where: {
          zendeskId: ticket.zendeskTicketFormId,
        },
      });

      if (dbTicketForm) {
        await dbTicket.setTicketForm(dbTicketForm);
      }
    }

    return true;
  };

  const ticketChunks = _.chunk(tickets, ticketQueueSize);

  for (const chunk of ticketChunks) {
    const results = await Promise.all(_.map(chunk, processTicket));

    loadedTicketCount += _.size(_.compact(results));
    task.output = `
      ${loadedTicketCount} of ${ticketLimit} tickets imported.
      Total active tickets in Zendesk: ${totalZendeskTicketCount}
    `;
  }

  // const results = [];
  // for (const ticket of tickets) {
  //   const result = await processTicket(ticket);
  //   results.push(result);
  // }

  // repeat till ticket limit
  if (loadedTicketCount < ticketLimit) {
    iteration++;

    await exports.importZendeskTicketsToDatabase({
      ticketAuditQueueSize,
      ticketLimit,
      ticketQueueSize,
      zendeskAuditCursor,
      task,
      iteration,
    });
  }

  return true;
};

// exports.importZendeskTicketsToDatabase = importZendeskTicketsToDatabase;

exports.getDiscoveryDocuments = async ({ task }) => {
  const { results } = await discovery.collections.query({
    query: '',
    count: 10000,
  });

  task.output = `${_.size(results)} documents imported from Discovery.`;

  return _.map(results, result => _.pick(result, ['id', 'title', 'text']));
};

exports.saveDiscoveryDocumentsToDatabase = async documents => {
  const res = await DiscoveryDocument.bulkCreate(_.map(documents, ({ id, title, text }) => ({
    title,
    text,
    discoveryId: id,
  })));

  return res;
};
