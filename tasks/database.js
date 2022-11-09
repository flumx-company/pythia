require('dotenv').config();

const _ = require('lodash');
const Listr = require('listr');
const { argv } = require('yargs');
const logger = require('../helpers/logger');
const {
  importZendeskTicketFormsToDatabase,
  importZendeskTicketsToDatabase,
  getDiscoveryDocuments,
  saveDiscoveryDocumentsToDatabase,
} = require('../services/database');

if (process.env.NODE_ENV !== 'production') {
  require('longjohn'); // eslint-disable-line
}

const QUEUE_SIZE = {
  TICKETS: argv.ticketQueueSize || 5,
  TICKET_AUDITS: argv.ticketAuditQueueSize || 1000,
};

const TICKET_LIMIT = argv.ticketLimit;
const ZENDESK_AUDIT_CURSOR = argv.zendeskAuditCursor;

const tasks = new Listr([
  {
    title: 'Importing Zendesk ticket forms to database',
    skip: () => argv.skipTicketForms,
    task: async () => {
      await importZendeskTicketFormsToDatabase();
    },
  },
  {
    title: 'Importing Zendesk tickets with audits and events to database',
    skip: () => argv.skipTickets,
    task: async (ctx, task) => {
      await importZendeskTicketsToDatabase({
        ticketQueueSize: QUEUE_SIZE.TICKETS,
        ticketLimit: TICKET_LIMIT,
        ticketAuditQueueSize: QUEUE_SIZE.TICKET_AUDITS,
        zendeskAuditCursor: ZENDESK_AUDIT_CURSOR,
        task,
      });
    },
  },
  // {
  //   title: 'Importing Discovery documents to database',
  //   skip: () => argv.skipDocuments,
  //   task: async (ctx, task) => {
  //     const documents = await getDiscoveryDocuments({
  //       task,
  //     });

  //     const res = await saveDiscoveryDocumentsToDatabase(documents, {
  //       task,
  //     });

  //     logger.info(res);
  //   },
  // },
]);

const run = async () => {
  try {
    await tasks.run();

    logger.info('Saved data to local database.');
    process.exit(0);
  } catch (err) {
    logger.error(...(_.has(err, 'response.data') ? [err.response.data, err.response.data.error] : [err]));
    process.exit(1);
  }
};

run();
