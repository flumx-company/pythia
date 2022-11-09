import _ from 'lodash';
import { toPlain } from '@/helpers/database';
import { getAllShortcuts } from '@/services/zendesk';
import { updateImportStatus } from '@/jobs/importZendeskData/utils';
import { ZendeskShortcut } from '@/db/models';

interface ImportZendeskShortcutsParams {
  clientId: string;
  zendeskChatApiToken?: string;
}

export default async ({
  clientId,
  zendeskChatApiToken,
}: ImportZendeskShortcutsParams) => {
  if (!zendeskChatApiToken) {
    return updateImportStatus(
      'No Zendesk Chat API token found, skipping shortcuts import',
      clientId,
    );
  }

  await updateImportStatus(
    'Getting shortcuts from Zendesk',
    clientId,
  );

  const shortcuts = await getAllShortcuts({
    zendeskChatApiToken,
  });

  await updateImportStatus(
    `${_.size(shortcuts)} shortcuts loaded from Zendesk`,
    clientId,
    {
      substep: true,
      key: 'shortcutsImported',
    },
  );

  const clientShortcuts = toPlain(await ZendeskShortcut.findAll({
    where: {
      clientId,
    },
  }));

  const clientShortcutZendeskIds = _.map(clientShortcuts, 'zendeskId');

  const preparedShortcuts = _(shortcuts)
    .filter(({ id }) => !_.includes(clientShortcutZendeskIds, id))
    .map(({ id, ...shortcut }) => ({
      ...shortcut,
      clientId,
      zendeskId: id,
    }))
    .value();

  await ZendeskShortcut.bulkCreate(preparedShortcuts);

  await updateImportStatus(
    `${_.size(preparedShortcuts)} new shortcuts saved to database`,
    clientId,
    {
      substep: true,
      key: 'shortcutsSaved',
    },
  );
};
