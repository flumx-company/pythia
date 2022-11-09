import importZendeskDynamicContent from '@/jobs/importZendeskData/steps/importZendeskDynamicContent';
import importZendeskMacros from '@/jobs/importZendeskData/steps/importZendeskMacros';
import importZendeskShortcuts from '@/jobs/importZendeskData/steps/importZendeskShortcuts';
import importZendeskTicketForms from '@/jobs/importZendeskData/steps/importZendeskTicketForms';
import importZendeskTicketData from '@/jobs/importZendeskData/steps/importZendeskTicketData';

export interface ZendeskDataImportParams {
  clientId: string;
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskChatApiToken?: string;
  zendeskDomain: string;
}

export default async ({
  clientId,
  zendeskUsername,
  zendeskApiToken,
  zendeskChatApiToken,
  zendeskDomain,
}: ZendeskDataImportParams) => {
  await importZendeskDynamicContent({
    clientId,
    zendeskUsername,
    zendeskApiToken,
    zendeskDomain,
  });

  await importZendeskMacros({
    clientId,
    zendeskUsername,
    zendeskApiToken,
    zendeskDomain,
  });

  await importZendeskShortcuts({
    clientId,
    zendeskChatApiToken,
  });

  await importZendeskTicketForms({
    clientId,
    zendeskUsername,
    zendeskApiToken,
    zendeskDomain,
  });

  await importZendeskTicketData({
    clientId,
    zendeskUsername,
    zendeskApiToken,
    zendeskDomain,
    // ticketLimit: 500,
  });
};
