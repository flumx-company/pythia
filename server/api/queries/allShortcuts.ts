import { getClientById, addZendeskMetadataToDocuments } from '@/server/api/utils';
import { toPlain } from '@/helpers/database';
import { DiscoveryDocument, DiscoveryCollection } from '@/db/models';
import shortcutsApi from '@/providers/zendesk/api/shortcuts';

interface AllShortcutsQueryParams {
  clientId: string;
}

export default async (parent: any, {
  clientId,
}: AllShortcutsQueryParams) => {
  const clientObject = await getClientById(clientId);
  const { zendeskChatApiToken } = clientObject;

  const documents = toPlain(await DiscoveryDocument.findAll({
    include: [{
      model: DiscoveryCollection,
      where: {
        clientId,
        type: 'shortcuts',
      },
    }],
  }));

  const zendeskShortcuts = await shortcutsApi.list({
    token: zendeskChatApiToken,
  });

  return addZendeskMetadataToDocuments(documents, zendeskShortcuts, 'shortcuts');
};
