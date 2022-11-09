import _ from 'lodash';
import { mapLimit, retry } from 'blend-promise-utils';
import discovery from '@/providers/watson/discovery';
import { TrainingEntity } from '@/types/pythia';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';
import { getWatsonErrorMessage } from '@/utils/misc';

interface UploadTrainingDataOptions {
  discoveryEnvironmentId: string;
  discoveryCollectionId: string;
  discoveryCollectionNativeId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
}

export default async (trainingEntities: TrainingEntity[], {
  discoveryEnvironmentId,
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
}: UploadTrainingDataOptions) => {
  await updateTrainingStatus(
    'Uploading training data to Discovery collection', {
      discoveryCollectionId,
    },
  );

  const totalTrainingEntityCount = _.size(trainingEntities);
  let currentTrainingEntityCount = 0;

  await mapLimit(trainingEntities, 10, async ({ query }) => {
    try {
      await retry(
        discovery.collections.addTrainingData,
        {
          maxAttempts: 3,
          delayMs: 300,
        },
      )({
        environmentId: discoveryEnvironmentId,
        collectionId: discoveryCollectionNativeId,
        apiKey: discoveryApiKey,
        url: discoveryUrl,
        body: query,
      });

      await updateTrainingStatus(
        `${++currentTrainingEntityCount} of ${totalTrainingEntityCount} training entities uploaded`,
        {
          discoveryCollectionId,
          substep: true,
          update: true,
        },
      );
    } catch (err) {
      updateTrainingStatus(
        `Upload training data error: ${getWatsonErrorMessage(err)}`, {
          discoveryCollectionId,
          onlyLog: true,
          type: 'error',
        },
      );
    }
  });
};
