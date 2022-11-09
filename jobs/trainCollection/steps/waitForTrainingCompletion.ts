import discovery from '@/providers/watson/discovery';
import { delay } from '@/helpers/misc';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';

interface WaitForTrainingCompletionParams {
  discoveryEnvironmentId: string;
  discoveryCollectionNativeId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  discoveryCollectionId: string;
  lastTrainedTime?: string;
}

const getTrainingStatus = async ({
  discoveryEnvironmentId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
}: WaitForTrainingCompletionParams) => {
  const { training_status: status } = await discovery.collections.listDetails({
    environmentId: discoveryEnvironmentId,
    collectionId: discoveryCollectionNativeId,
    apiKey: discoveryApiKey,
    url: discoveryUrl,
  });

  return status;
};

const waitForPositiveTrainingStatus = async ({
  discoveryEnvironmentId,
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
  lastTrainedTime,
}: WaitForTrainingCompletionParams): Promise<boolean> => {
  const status = await getTrainingStatus({
    discoveryEnvironmentId,
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryApiKey,
    discoveryUrl,
  });

  // training is completed when successfully trained time is updated
  if (status.successfully_trained && status.successfully_trained !== lastTrainedTime) {
    await updateTrainingStatus('Collection has been successfully trained', {
      discoveryCollectionId,
    });

    return true;
  }

  await updateTrainingStatus(`Still training, last checked ${new Date().toLocaleString()}`, {
    discoveryCollectionId,
    substep: true,
    update: true,
  });

  await delay(60 * 5000);

  return waitForPositiveTrainingStatus({
    discoveryEnvironmentId,
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryApiKey,
    discoveryUrl,
    lastTrainedTime,
  });
};

export default async ({
  discoveryEnvironmentId,
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
}: WaitForTrainingCompletionParams) => {
  await updateTrainingStatus('Waiting for Discovery collection to be trained', {
    discoveryCollectionId,
  });

  const { successfully_trained: lastTrainedTime } = await getTrainingStatus({
    discoveryEnvironmentId,
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryApiKey,
    discoveryUrl,
  });

  return waitForPositiveTrainingStatus({
    discoveryEnvironmentId,
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryApiKey,
    discoveryUrl,
    lastTrainedTime,
  });
};
