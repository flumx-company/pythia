import { Client, DiscoveryCollection } from '@/db/models';
import { toPlain } from '@/helpers/database';
import trainCollection, {
  TrainCollectionParams,
} from '@/jobs/trainCollection/trainCollection';
import {
  stopCollectionTraining,
  startCollectionTraining,
  setInitialTrainingCollectionStatus,
  finishCollectionTraining,
} from '@/jobs/trainCollection/utils';

const handleDiscoveryCollectionTraining = async (trainCollectionParams: TrainCollectionParams) => {
  const { discoveryCollectionId } = trainCollectionParams;

  await setInitialTrainingCollectionStatus(discoveryCollectionId);

  const trainingId = await startCollectionTraining(trainCollectionParams);
  trainCollectionParams.trainingId = trainingId;

  let result = [];

  try {
    result = await trainCollection(trainCollectionParams);
  } catch (err) {
    return stopCollectionTraining({
      discoveryCollectionId,
      trainingId,
      err,
    });
  }

  await finishCollectionTraining(trainCollectionParams, result);
};

export default async (root: any, { id, skipTraining, useTranslit }: any) => {
  const dbDiscoveryCollection = await DiscoveryCollection.findOne({
    where: {
      id,
    },
    include: [Client],
  });

  const discoveryCollection = toPlain(dbDiscoveryCollection);

  const trainCollectionParams = {
    skipTraining,
    useTranslit,
    clientId: discoveryCollection.client.id,
    zendeskUsername: discoveryCollection.client.zendeskUsername,
    zendeskApiToken: discoveryCollection.client.zendeskApiToken,
    zendeskDomain: discoveryCollection.client.zendeskDomain,
    discoveryCollectionId: discoveryCollection.id,
    discoveryCollectionNativeId: discoveryCollection.discoveryId,
    discoveryCollectionType: discoveryCollection.type,
    discoveryUsername: discoveryCollection.client.discoveryUsername,
    discoveryPassword: discoveryCollection.client.discoveryPassword,
    discoveryApiKey: discoveryCollection.client.discoveryApiKey,
    discoveryUrl: discoveryCollection.client.discoveryUrl,
    discoveryEnvironmentId: discoveryCollection.client.discoveryEnvironmentId,
    nluUsername: discoveryCollection.client.nluUsername,
    nluPassword: discoveryCollection.client.nluPassword,
    nluApiKey: discoveryCollection.client.nluApiKey,
    nluModelId: discoveryCollection.nluModelId,
    trainingId: '',
  };

  // doesn't need to be awaited to prevent long request server error
  handleDiscoveryCollectionTraining(trainCollectionParams);
};
