import _ from 'lodash';
import { mapLimit } from 'blend-promise-utils';
import zendesk from '@/providers/zendesk';
import { updateImportStatus } from '@/jobs/importZendeskData/utils';
import { toPlain } from '@/helpers/database';
import {
  ZendeskTicket,
  ZendeskTicketForm,
  ZendeskTicketAudit,
  ZendeskTicketAuditEvent,
}  from '@/db/models';
import {
  Ticket,
  TicketForm,
  TicketAudit,
} from '@/types/zendesk';
import {
  PythiaZendeskTicket,
  PythiaZendeskTicketAudit,
} from '@/types/pythia';

interface GetTotalZendeskTicketCountParams {
  clientId: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  zendeskUsername: string;
  retries: number;
}

const getTotalZendeskTicketCount = async ({
  clientId,
  zendeskApiToken,
  zendeskDomain,
  zendeskUsername,
  retries = 1,
}: GetTotalZendeskTicketCountParams): Promise<number> => {
  try {
    const { count } = await zendesk.tickets.list(null, {
      token: zendeskApiToken,
      url: zendeskDomain,
      username: zendeskUsername,
    });

    return count;
  } catch (err) {
    await updateImportStatus(
      `Error while getting Zendesk ticket count: ${err.message}, retrying. Retries: ${retries}`,
      clientId,
      {
        onlyLog: true,
        type: 'error',
      },
    );

    return getTotalZendeskTicketCount({
      clientId,
      zendeskApiToken,
      zendeskDomain,
      zendeskUsername,
      retries: retries + 1,
    });
  }
};

interface GetZendeskTicketDataParams {
  clientId: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  zendeskUsername: string;
  zendeskAuditCursor?: string;
  retries?: number;
}

interface ZendeskTicketData {
  beforeCursor: string;
  tickets: Ticket[];
  audits: TicketAudit[];
}

const getZendeskTicketData = async ({
  clientId,
  zendeskApiToken,
  zendeskDomain,
  zendeskUsername,
  zendeskAuditCursor = undefined,
  retries = 1,
}: GetZendeskTicketDataParams): Promise<ZendeskTicketData> => {
  try {
    return zendesk.tickets.listAudits({
      include: ['tickets'],
      cursor: zendeskAuditCursor,
    }, {
      token: zendeskApiToken,
      url: zendeskDomain,
      username: zendeskUsername,
    });
  } catch (err) {
    await updateImportStatus(
      `Error while getting Zendesk data: ${err.message}, retrying. Retries: ${retries}`,
      clientId,
      {
        onlyLog: true,
        type: 'error',
      },
    );

    return getZendeskTicketData({
      clientId,
      zendeskApiToken,
      zendeskDomain,
      zendeskUsername,
      zendeskAuditCursor,
      retries: retries + 1,
    });
  }
};

interface FormTicketAuditsParams {
  zendeskTicketData: ZendeskTicketData;
  zendeskTicketId: string;
  clientId: string;
}

const formTicketAudits = ({
  zendeskTicketData,
  zendeskTicketId,
  clientId,
}: FormTicketAuditsParams): PythiaZendeskTicketAudit[] =>
  _(zendeskTicketData.audits)
    .filter(audit => audit.ticket_id === zendeskTicketId)
    .map(audit => {
      const auditEvents = _.map(audit.events, event => ({
        clientId,
        type: event.type,
        body: _.isString(event.body) ? event.body : '',
        value: event.value,
        previousValue: event.previous_value,
        macroId: event.macro_id,
        fieldName: event.field_name,
        zendeskId: event.id,
      }));

      return {
        clientId,
        zendeskId: audit.id,
        zendeskAuthorId: audit.author_id,
        zendeskCreatedAt: audit.created_at,
        events: auditEvents,
      };
    })
    .value();

interface FormTicketParams {
  zendeskTicketData: ZendeskTicketData;
  ticketForms: TicketForm[];
  clientId: string;
}

const formTickets = ({
  zendeskTicketData,
  ticketForms,
  clientId,
}: FormTicketParams): PythiaZendeskTicket[] =>
  _.map(zendeskTicketData.tickets, ({
    url,
    id,
    type,
    subject,
    description,
    tags,
    created_at: zendeskCreatedAt,
    ticket_form_id: zendeskTicketFormId,
  }) => {
    const audits = formTicketAudits({
      clientId,
      zendeskTicketData,
      zendeskTicketId: id,
    });
    const ticketForm = _.find(ticketForms, ({ zendeskId }) => zendeskTicketFormId === zendeskId);

    return {
      subject,
      type,
      description,
      tags,
      url,
      clientId,
      audits,
      zendeskCreatedAt,
      zendeskId: id,
      zendeskTicketFormId: ticketForm && ticketForm.id,
    };
  });

interface ProcessZendeskTicketOptions {
  clientId: string;
}

// TODO: implement more performant database save
// XXX: If facing 'JavaScript heap out of memory', error, check:
// eslint-disable-next-line max-len
// https://stackoverflow.com/questions/26094420/fatal-error-call-and-retry-last-allocation-failed-process-out-of-memory
const processZendeskTicket = async (
  ticket: PythiaZendeskTicket,
  {
    clientId,
  }: ProcessZendeskTicketOptions,
  ): Promise<boolean> => {
  const include = [{
    model: ZendeskTicketAudit,
    as: 'audits',
    include: [{
      model: ZendeskTicketAuditEvent,
      as: 'events',
    }],
  }];

  let dbZendeskTicket: any;

  try {
    dbZendeskTicket = await ZendeskTicket.findOne({
      include,
      where: {
        clientId,
        zendeskId: ticket.zendeskId,
      },
    });

    if (dbZendeskTicket) {
      const existingTicketAuditZendeskIds = _.map(dbZendeskTicket.audits, 'zendeskId');
      const newTicketAudits = _.filter(
        ticket.audits,
        ({ zendeskId }) => !_.includes(existingTicketAuditZendeskIds, zendeskId && zendeskId.toString()),
      );

      // track https://github.com/sequelize/sequelize/issues/3277
      // for bulkCreate with includes
      const createdDbTicketAudits = await ZendeskTicketAudit.bulkCreate(newTicketAudits);
      const createdTicketAudits = toPlain(createdDbTicketAudits);
      const newTicketAuditEvents = _(newTicketAudits)
        .map(audit => {
          const dbTicketAudit = _.find(
            createdTicketAudits,
            ({ zendeskId }) => zendeskId === audit.zendeskId,
          );

          return _.map(audit.events, event => ({
            ...event,
            zendeskTicketAuditId: dbTicketAudit && dbTicketAudit.id,
          }));
        })
        .flatten()
        .value();

      await ZendeskTicketAuditEvent.bulkCreate(newTicketAuditEvents);

      const allAudits = [...dbZendeskTicket.audits, ...createdDbTicketAudits];
      await dbZendeskTicket.setAudits(allAudits);

      return false;
    }

    dbZendeskTicket = await ZendeskTicket.create(ticket, { include });
  } catch (err) {
    const errorMessage = err && err.errors ? err.errors[0].message : err.message;
    await updateImportStatus(
      errorMessage,
      clientId,
      {
        onlyLog: true,
        type: 'error',
      },
    );

    return false;
  }

  // bind ticket to form if present
  if (ticket.zendeskTicketFormId) {
    const dbTicketForm = await ZendeskTicketForm.findOne({
      where: {
        zendeskId: ticket.zendeskTicketFormId,
      },
    });

    if (dbTicketForm) {
      await dbZendeskTicket.setTicketForm(dbTicketForm);
    }
  }

  return true;
};

interface ImportZendeskTicketDataParams {
  clientId: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  zendeskUsername: string;
  zendeskAuditCursor?: string;
  iteration?: number;
  currentTicketCount?: number;
  ticketLimit?: number;
}

const importZendeskTicketData = async ({
  clientId,
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
  zendeskAuditCursor = undefined,
  iteration = 1,
  currentTicketCount = 0,
  ticketLimit,
}: ImportZendeskTicketDataParams): Promise<void> => {
  if (iteration === 1) {
    await updateImportStatus(
      'Importing Zendesk ticket data to database',
      clientId,
    );

    if (ticketLimit) {
      await updateImportStatus(
        `Ticket limit set to ${ticketLimit}`,
        clientId,
        {
          substep: true,
        },
      );
    }
  }

  await updateImportStatus(
    `Iteration: ${iteration}.${
      zendeskAuditCursor ? ` Cursor: ${zendeskAuditCursor}.` : ''
    }`,
    clientId,
    {
      onlyLog: true,
    },
  );

  const zendeskTicketData = await getZendeskTicketData({
    clientId,
    zendeskApiToken,
    zendeskDomain,
    zendeskUsername,
    zendeskAuditCursor,
  });

  if (!zendeskTicketData) {
    await updateImportStatus(
      `Zendesk ticket data has not been received at ${zendeskAuditCursor || 'first'} cursor, retrying.`,
      clientId,
      {
        onlyLog: true,
        type: 'error',
      },
    );

    // TODO: implement retries or skip completely
    return importZendeskTicketData({
      clientId,
      zendeskApiToken,
      zendeskDomain,
      zendeskUsername,
    });
  }

  const ticketForms = toPlain(await ZendeskTicketForm.findAll({
    where: {
      clientId,
    },
  }));

  let tickets = formTickets({
    zendeskTicketData,
    ticketForms,
    clientId,
  });

  let ticketCount = currentTicketCount;
  let isFacedLimit = false;

  if (ticketLimit) {
    const newTicketCount = currentTicketCount + _.size(tickets);

    if (newTicketCount > ticketLimit) {
      tickets = _.dropRight(tickets, newTicketCount - ticketLimit);
      isFacedLimit = true;
    }
  }

  const processedTickets = _.compact(await mapLimit(
    tickets,
    10,
    ticket => processZendeskTicket(ticket, {
      clientId,
    }),
  ));

  const processedTicketCount = _.size(processedTickets);

  // zero processed tickets means all tickets from this iteration
  // have already been added to database, and we can assume
  // no new tickets are available. This is quite an assumption
  // but there seems to be no better method for finding out if
  // there are new tickets as Incremental Exports Zendesk API
  // does not support sideloading audits:
  // https://developer.zendesk.com/rest_api/docs/support/incremental_export#side-loading
  if (!processedTicketCount && (iteration > 1)) {
    return;
  }

  ticketCount += processedTicketCount;

  const dbZendeskTicketCount = await ZendeskTicket.count({
    where: {
      clientId,
    },
  });

  const nextZendeskAuditCursor = zendeskTicketData.beforeCursor;
  const isImportCompleted = nextZendeskAuditCursor === null || isFacedLimit;

  await updateImportStatus(
    `${ticketCount} new tickets imported. Total tickets in database: ${dbZendeskTicketCount}`,
    clientId,
    {
      substep: true,
      update: true,
      forcePublish: isImportCompleted,
    },
  );

  if (isImportCompleted) {
    return;
  }

  return importZendeskTicketData({
    clientId,
    zendeskApiToken,
    zendeskDomain,
    zendeskUsername,
    ticketLimit,
    zendeskAuditCursor: nextZendeskAuditCursor,
    iteration: iteration + 1,
    currentTicketCount: ticketCount,
  });
};

export default importZendeskTicketData;
