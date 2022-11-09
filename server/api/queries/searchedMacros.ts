import _ from 'lodash';
// import sanitizeHtml from 'sanitize-html';
import macrosService from '@/services/macros';
import messages from '@/enums/messages';
import { getClientById, filterEntitiesByQuery } from '@/server/api/utils';

export default async (root: any, {
  query,
  clientId,
  highlightClassName,
}: any) => {
  if (!clientId) {
    throw new Error(messages.NO_CLIENT_ID);
  }

  const clientObject = await getClientById(clientId);

  if (!clientObject) {
    throw new Error(messages.CLIENT_NOT_FOUND);
  }

  const macros = _.map(await macrosService.getAll({
    username: clientObject.zendeskUsername,
    token: clientObject.zendeskApiToken,
    url: clientObject.zendeskDomain,
  }), macro => ({
    id: macro.id,
    title: macro.title,
    // text: sanitizeHtml(macrosService.getCommentFromActions(macro, { filter: false }), {
    //   allowedTags: [],
    //   allowedAttributes: {},
    // }),
    text: macrosService.getCommentFromActions(macro, { filter: false }),
    zendeskMacroId: _.toString(macro.id),
  }));

  const res = filterEntitiesByQuery(macros, query, { highlightClassName });
  return res;
};
