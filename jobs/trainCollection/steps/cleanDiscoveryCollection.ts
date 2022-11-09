import { deleteAllDocuments } from '@/services/discovery';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';

interface CleanDiscoveryCollectionParams {
  discoveryCollectionId: string;
  discoveryEnvironmentId: string;
  discoveryCollectionNativeId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
}

export default async ({
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
}: CleanDiscoveryCollectionParams) => {
  await updateTrainingStatus('Removing existing documents from Discovery collection', {
    discoveryCollectionId,
  });

  await deleteAllDocuments({
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
    discoveryCollectionId,
    discoveryCollectionNativeId,
    async onProgress({
      current,
      total,
    }: any) {
      const label = total
       ? `${current} of ${total} Discovery documents removed`
       : 'No Discovery documents found';

      await updateTrainingStatus(label, {
        discoveryCollectionId,
        substep: true,
        update: true,
      });
    },
  });
};
