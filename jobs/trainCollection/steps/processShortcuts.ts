import _ from 'lodash';
import { translit } from '@/helpers/misc';
import { uploadDocuments } from '@/services/discovery';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';
import { ZendeskShortcut } from '@/db/models';
import { toPlain } from '@/helpers/database';

interface ProcessShortcutsParams {
  clientId: string;
  useTranslit: boolean;
  discoveryCollectionId: string;
  discoveryEnvironmentId: string;
  discoveryCollectionNativeId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
}

export default async ({
  clientId,
  useTranslit,
  discoveryCollectionId,
  discoveryEnvironmentId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
}: ProcessShortcutsParams) => {
  await updateTrainingStatus('Processing Zendesk shortcuts', { discoveryCollectionId });

  const zendeskShortcuts = toPlain(await ZendeskShortcut.findAll({
    where: {
      clientId,
    },
  }));

  const totalZendeskShortcutCount = _.size(zendeskShortcuts);

  await updateTrainingStatus(`${totalZendeskShortcutCount} shortcuts found in the database`, {
    discoveryCollectionId,
    substep: true,
  });

  const processedZendeskShortcuts = useTranslit ? _.map(
    zendeskShortcuts,
    ({ id, name, message, zendeskId }) => ({
      id,
      zendeskId,
      name: translit(name),
      message: translit(message),
    }),
  ) : zendeskShortcuts;

  await updateTrainingStatus(`${_.size(processedZendeskShortcuts)} shortcuts left after processing`, {
    discoveryCollectionId,
    substep: true,
  });

  const discoveryDocuments = _.map(processedZendeskShortcuts, ({ id, zendeskId, name, message }) => ({
    title: name,
    text: message,
    zendeskShortcutId: zendeskId,
    zendeskShortcutDbId: id,
  }));

  await updateTrainingStatus(
    'Uploading shortcuts as documents to Discovery collection and saving them in the database',
    { discoveryCollectionId },
  );

  await uploadDocuments(discoveryDocuments, {
    discoveryCollectionNativeId,
    discoveryCollectionId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
    async onProgress({ current, total }) {
      await updateTrainingStatus(
        `${current} of ${total} Discovery documents uploaded`, {
          discoveryCollectionId,
          substep: true,
          update: true,
        },
      );
    },
  });
};
