import _ from 'lodash';
import sanitizeHtml from 'sanitize-html';
import messages from '@/enums/messages';
import { getClientById, filterEntitiesByQuery } from '@/server/api/utils';
import shortcutsApi from '@/providers/zendesk/api/shortcuts';

export default async (root: any, {
  query,
  clientId,
  highlightClassName = 'pythia-highlight',
}: any) => {
  if (!clientId) {
    throw new Error(messages.NO_CLIENT_ID);
  }

  const clientObject = await getClientById(clientId);

  if (!clientObject) {
    throw new Error(messages.CLIENT_NOT_FOUND);
  }

  const entities = _.map(await shortcutsApi.list({
    token: clientObject.zendeskChatApiToken,
  }), shortcut => ({
    id: shortcut.id,
    title: shortcut.name,
    text: sanitizeHtml(shortcut.message, {
      allowedTags: [],
      allowedAttributes: {},
    }),
    zendeskShortcutId: _.toString(shortcut.id),
  }));

  return filterEntitiesByQuery(entities, query, { highlightClassName });
};
