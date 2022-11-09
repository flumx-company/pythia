import _ from 'lodash';
import Entity from '@/types/entity';
import { Training, DiscoveryCollection } from '@/db/models';
import { TrainCollectionParams } from '@/jobs/trainCollection/trainCollection';
import { toPlain } from '@/helpers/database';
import { TrainingEntity, TrainingEntityQueryExample } from '@/types/pythia';
import {
  updateJobStatus,
  setJobStatus,
  addJobErrorStatus,
} from '@/jobs/utils';

export const COLLECTION_TRAINING_TYPE = 'collectionTrainingStatus';

interface UpdateTrainingStatusOptions {
  discoveryCollectionId: string;
  [key: string]: any;
}

export const updateTrainingStatus = async (
  label: string,
  options: UpdateTrainingStatusOptions,
) => {
  const { discoveryCollectionId, ...otherParams } = options;

  return updateJobStatus(label, {
    id: discoveryCollectionId,
    type: COLLECTION_TRAINING_TYPE,
  }, otherParams);
};

export const setInitialTrainingCollectionStatus = async (id: string): Promise<null> =>
  setJobStatus({
    steps: [],
    error: null,
    started: false,
    ended: false,
    offed: true,
  }, {
    id,
    type: COLLECTION_TRAINING_TYPE,
  });

export const startCollectionTraining = async ({ discoveryCollectionId, useTranslit }: TrainCollectionParams): Promise<string> => {
  const [, dbTraining] = await Promise.all([
    updateJobStatus('Training started', {
      id: discoveryCollectionId,
      type: COLLECTION_TRAINING_TYPE,
    }),

    Training.create({
      discoveryCollectionId,
      useTranslit,
      trainedAt: null,
    }),
    DiscoveryCollection.update({
      isBeingTrained: true,
    }, {
      where: { id: discoveryCollectionId },
    }),
  ]);

  await setJobStatus({
    started: true,
    offed: false,
  }, {
    id: discoveryCollectionId,
    type: COLLECTION_TRAINING_TYPE,
  });

  const { id: trainingId } = toPlain(dbTraining);

  return trainingId;
};

interface StopCollectionTrainingParams {
  discoveryCollectionId: string;
  trainingId: string;
  err: Error;
}

export const stopCollectionTraining = async ({
  discoveryCollectionId,
  trainingId,
  err,
}: StopCollectionTrainingParams) => {

  await Promise.all([
    updateJobStatus(err.message, {
      id: discoveryCollectionId,
      type: COLLECTION_TRAINING_TYPE,
    }),

    DiscoveryCollection.update({
      isBeingTrained: false,
    }, {
      where: { id: discoveryCollectionId },
    }),

    Training.destroy({
      where: { id: trainingId },
    }),
  ]);

  return addJobErrorStatus(err, {
    id: discoveryCollectionId,
    type: COLLECTION_TRAINING_TYPE,
  });
};

export const finishCollectionTraining = async (
  { discoveryCollectionId, trainingId }: TrainCollectionParams, result: Entity[],
) => {
  const now = new Date();

  await Promise.all([
    updateJobStatus('Training finished', {
      id: discoveryCollectionId,
      type: COLLECTION_TRAINING_TYPE,
    }, {
      labelType: 'success',
    }),

    DiscoveryCollection.update({
      isBeingTrained: false,
      lastTrainedAt: now,
    }, {
      where: { id: discoveryCollectionId },
    }),
    Training.update({
      trainedAt: now,
    }, {
      where: { id: trainingId },
    }),
  ]);

  return setJobStatus({
    ended: true,
  }, {
    id: discoveryCollectionId,
    type: COLLECTION_TRAINING_TYPE,
  });
};

export const getRelevantDocumentId = (entity: TrainingEntity): string => {
  const relevantExample = _.find(
    entity.query.examples,
    ({ relevance }) => relevance === 10,
  ) as TrainingEntityQueryExample;

  return relevantExample.document_id;
};
