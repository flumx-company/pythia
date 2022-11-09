import _ from 'lodash';
import { toPlain } from '@/helpers/database';
import { getAllMacros } from '@/services/zendesk';
import { updateImportStatus } from '@/jobs/importZendeskData/utils';
import { ZendeskMacro } from '@/db/models';

interface ImportZendeskMacrosParams {
  clientId: string;
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskDomain: string;
}

export default async ({
  clientId,
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
}: ImportZendeskMacrosParams) => {
  await updateImportStatus(
    'Getting macros from Zendesk',
    clientId,
  );

  const macros = await getAllMacros({
    zendeskUsername,
    zendeskApiToken,
    zendeskDomain,
    async onProgress({
      total,
    }) {
      await updateImportStatus(
        `${total} macros loaded from Zendesk`,
        clientId,
        {
          substep: true,
          key: 'macrosImported',
        },
      );
    },
  });

  const clientMacros = toPlain(await ZendeskMacro.findAll({
    where: {
      clientId,
    },
  }));

  const clientMacroZendeskIds = _.map(clientMacros, 'zendeskId');

  const preparedMacros = _(macros)
    .filter(({ id }) => !_.includes(clientMacroZendeskIds, id!.toString()))
    .map(({
      id,
      title,
      description,
      created_at,
      actions,
      active,
      position,
      restriction,
    }) => ({
      title,
      description,
      actions,
      active,
      position,
      restriction,
      clientId,
      zendeskCreatedAt: created_at,
      zendeskId: id,
    }))
    .value();

  await ZendeskMacro.bulkCreate(preparedMacros);

  await updateImportStatus(
    `${_.size(preparedMacros)} new macros saved to database`,
    clientId,
    {
      substep: true,
      key: 'macrosSaved',
    },
  );
};
