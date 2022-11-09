import _ from 'lodash';
import { toPlain } from '@/helpers/database';
import { prepareMacros } from '@/services/zendesk';
import { uploadDocuments } from '@/services/discovery';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';
import { ZendeskMacro } from '@/db/models';

interface ProcessMacrosParams {
  useTranslit: boolean;
  discoveryCollectionId: string;
  discoveryEnvironmentId: string;
  discoveryCollectionNativeId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  clientId: string;
}

export default async ({
  useTranslit,
  discoveryCollectionId,
  discoveryEnvironmentId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
  clientId,
}: ProcessMacrosParams) => {
  await updateTrainingStatus('Processing Zendesk macros', { discoveryCollectionId });

  const zendeskMacros = toPlain(await ZendeskMacro.findAll({
    where: {
      clientId,
    },
  }));

  await updateTrainingStatus(`${_.size(zendeskMacros)} macros found in the database`, {
    discoveryCollectionId,
    substep: true,
  });

  const processedZendeskMacros = await prepareMacros(zendeskMacros, {
    clientId,
    useTranslit,
  });

  await updateTrainingStatus(`${_.size(processedZendeskMacros)} macros left after processing`, {
    discoveryCollectionId,
    substep: true,
  });

  const discoveryDocuments = _.map(processedZendeskMacros, ({ id, title, text, zendeskId }) => ({
    title,
    text,
    zendeskMacroId: zendeskId,
    zendeskMacroDbId: id,
  }));

  await updateTrainingStatus(
    'Uploading macros as documents to Discovery collection and saving them in the database',
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
