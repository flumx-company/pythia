import _ from 'lodash';
import { TrainingEntity } from '@/types/pythia';
import { TrainingResult } from '@/db/models';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';

interface SaveTrainingResultsOptions {
  discoveryCollectionId: string;
}

export default async (trainingEntities: TrainingEntity[], {
  discoveryCollectionId,
}: SaveTrainingResultsOptions) => {
  await updateTrainingStatus(
    'Saving training results to database',
    { discoveryCollectionId },
  );

  const trainingResults = _.map(trainingEntities, 'trainingResult');

  await TrainingResult.bulkCreate(trainingResults);

  await updateTrainingStatus(
    `${_.size(trainingResults)} training results saved`,
    { discoveryCollectionId },
  );
};
