import _ from 'lodash';
import { mapLimit } from 'blend-promise-utils';
import discovery from '@/providers/watson/discovery';
import { TrainingEntity, TrainingEntityQueryExample } from '@/types/pythia';
import { updateTrainingStatus, getRelevantDocumentId } from '@/jobs/trainCollection/utils';

interface GetNegativeExamplesParams {
  relevantDocumentId?: string | null;
  discoveryCollectionNativeId: string;
  discoveryEnvironmentId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  naturalLanguageQuery: string;
  retries?: number;
}

const getNegativeExamples = async ({
  relevantDocumentId,
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
  naturalLanguageQuery,
}: GetNegativeExamplesParams): Promise<TrainingEntityQueryExample[]> => {
  const { results } = await discovery.collections.query({
    environmentId: discoveryEnvironmentId,
    collectionId: discoveryCollectionNativeId,
    apiKey: discoveryApiKey,
    url: discoveryUrl,
    natural_language_query: naturalLanguageQuery,
    count: 10,
  } as any);

  // get Discovery query results that don't match query as negative examples
  return _(results)
    .filter(({ id }) => id !== relevantDocumentId)
    .map(({ id }) => ({
      document_id: id,
      relevance: 0,
    }))
    .value();
};

interface AddNegativeExamplesOptions {
  discoveryCollectionId: string;
  discoveryCollectionNativeId: string;
  discoveryEnvironmentId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
}

export default async (trainingEntities: TrainingEntity[], {
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
}: AddNegativeExamplesOptions): Promise<TrainingEntity[]> => {
  await updateTrainingStatus(
    'Adding negative examples to training data set',
    {
      discoveryCollectionId,
    },
  );

  const totalNegativeExampleCount = _.size(trainingEntities);
  let currentNegativeExampleCount = 0;

  return mapLimit(trainingEntities, 5, async trainingEntity => {
    const {
      query: {
        natural_language_query: naturalLanguageQuery,
      },
    } = trainingEntity;

    const relevantDocumentId = getRelevantDocumentId(trainingEntity);

    const negativeExamples = await getNegativeExamples({
      relevantDocumentId,
      naturalLanguageQuery,
      discoveryCollectionNativeId,
      discoveryEnvironmentId,
      discoveryApiKey,
      discoveryUrl,
    });

    trainingEntity.query.examples = [
      ...trainingEntity.query.examples,
      ...negativeExamples,
    ];

    await updateTrainingStatus(
      `${++currentNegativeExampleCount} of ${totalNegativeExampleCount} negative examples added`,
      {
        discoveryCollectionId,
        substep: true,
        update: true,
      },
    );

    return trainingEntity;
  });
};
