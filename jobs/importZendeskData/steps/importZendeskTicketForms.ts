import _ from 'lodash';
import { map, retry } from 'blend-promise-utils';
import zendesk from '@/providers/zendesk';
import { updateImportStatus } from '@/jobs/importZendeskData/utils';
import { ZendeskTicketForm }  from '@/db/models';
import { TicketForm } from '@/types/zendesk';

interface ImportZendeskTicketFormsParams {
  clientId: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  zendeskUsername: string;
}

export default async ({
  clientId,
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
}: ImportZendeskTicketFormsParams) => {
  let ticketForms: TicketForm[] = [];

  await updateImportStatus(
    'Importing Zendesk ticket forms to database',
    clientId,
  );

  try {
    ({ ticketForms } = await retry(
      zendesk.tickets.listForms,
      {
        maxAttempts: 3,
        delayMs: 1000,
      })({}, {
        token: zendeskApiToken,
        url: zendeskDomain,
        username: zendeskUsername,
      }));
  } catch (err) {
    await updateImportStatus(
      err.message,
      clientId,
      {
        type: 'error',
      },
    );
  }

  ticketForms = await map(ticketForms, async ({
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
      zendeskCreatedAt,
      default: isDefault,
      zendeskId: id,
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
  });

  await updateImportStatus(
    `${_.size(ticketForms)} ticket forms imported `,
    clientId,
    {
      substep: true,
    },
  );

  return ticketForms;
};
