import _ from 'lodash';
import math from 'mathjs';
import { mapLimit } from 'blend-promise-utils';
import { TrainingEntity } from '@/types/pythia';
import discovery from '@/providers/watson/discovery';
import { getRelevantDocumentId, updateTrainingStatus } from '@/jobs/trainCollection/utils';

interface AddNonTrainedResultsParams {
  discoveryCollectionId: string;
  discoveryCollectionNativeId: string;
  discoveryEnvironmentId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  isTrained: boolean;
}

export default async (testingEntities: TrainingEntity[], {
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
  isTrained,
}: AddNonTrainedResultsParams) => {
  await updateTrainingStatus(
    `Adding scores and ranks to testing set from ${isTrained ? '' : 'un'}trained collection`,
    { discoveryCollectionId },
  );

  const totalTestingEntityCount = _.size(testingEntities);
  let currentTestingEntityCount = 0;

  return mapLimit(testingEntities, 5, async testingEntity => {
    const { results } = await discovery.collections.query({
      environmentId: discoveryEnvironmentId,
      collectionId: discoveryCollectionNativeId,
      apiKey: discoveryApiKey,
      url: discoveryUrl,
      natural_language_query: testingEntity.query.natural_language_query,
      count: 1000,
    } as any);

    const relevantDocumentId = getRelevantDocumentId(testingEntity);

    let relevantDocumentRank;
    let relevantDocumentScore;

    _.forEach(results, ({ id, result_metadata: { score } }, i) => {
      if (id === relevantDocumentId) {
        relevantDocumentRank = i + 1;
        relevantDocumentScore = math.round(score, 3);
      }
    });

    await updateTrainingStatus(
      `${++currentTestingEntityCount} of ${totalTestingEntityCount} testing entities queried`,
      {
        discoveryCollectionId,
        substep: true,
        update: true,
      },
    );

    return {
      ...testingEntity,
      trainingResult: {
        ...testingEntity.trainingResult,
        [isTrained ? 'rankAfterTraining' : 'rankBeforeTraining']: relevantDocumentRank,
        [isTrained ? 'scoreAfterTraining' : 'scoreBeforeTraining']: relevantDocumentScore,
      },
    };
  });
};
