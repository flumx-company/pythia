import _ from 'lodash';
import { toPlain } from '@/helpers/database';
import { getAllDynamicContentItems } from '@/services/zendesk';
import { updateImportStatus } from '@/jobs/importZendeskData/utils';
import { ZendeskDynamicContentItem } from '@/db/models';

interface ImportZendeskDefaultContentParams {
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
}: ImportZendeskDefaultContentParams) => {
  await updateImportStatus(
    'Getting dynamic content items from Zendesk',
    clientId,
  );

  const dcItems = await getAllDynamicContentItems({
    zendeskUsername,
    zendeskApiToken,
    zendeskDomain,
    async onProgress({
      total,
    }) {
      await updateImportStatus(
        `${total} dynamic content items loaded from Zendesk`,
        clientId,
        {
          substep: true,
          key: 'dcImported',
        },
      );
    },
  });

  const clientDcItems = toPlain(await ZendeskDynamicContentItem.findAll({
    where: {
      clientId,
    },
  }));

  const clientDcItemZendeskIds = _.map(clientDcItems, 'zendeskId');

  const preparedDcItems = _(dcItems)
    .filter(({ id }) => !_.includes(clientDcItemZendeskIds, id!.toString()))
    .map(({
      id,
      name,
      placeholder,
      default_locale_id,
      outdated,
      created_at,
      variants,
    }) => ({
      name,
      placeholder,
      outdated,
      variants,
      clientId,
      defaultLocaleId: default_locale_id,
      zendeskCreatedAt: created_at,
      zendeskId: id,
    }))
    .value();

  await ZendeskDynamicContentItem.bulkCreate(preparedDcItems);

  await updateImportStatus(
    `${_.size(preparedDcItems)} new dynamic content items saved to database`,
    clientId,
    {
      substep: true,
      key: 'dcSaved',
    },
  );
};
