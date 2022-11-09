import cleanDiscoveryCollection from '@/jobs/trainCollection/steps/cleanDiscoveryCollection';
import processMacros from '@/jobs/trainCollection/steps/processMacros';
import processShortcuts from '@/jobs/trainCollection/steps/processShortcuts';
import formTrainingEntities from '@/jobs/trainCollection/steps/formTrainingEntities';
import addNegativeExamples from '@/jobs/trainCollection/steps/addNegativeExamples';
import addTrainingResults from '@/jobs/trainCollection/steps/addTrainingResults';
import uploadTrainingData from '@/jobs/trainCollection/steps/uploadTrainingData';
import waitForTrainingCompletion from '@/jobs/trainCollection/steps/waitForTrainingCompletion';
import saveTrainingResults from '@/jobs/trainCollection/steps/saveTrainingResults';
// import { saveJsonToTempFile } from '@/helpers/file';

export type DiscoveryCollectionTypes = 'macros' | 'shortcuts';

export interface TrainCollectionParams {
  clientId: string;
  trainingId: string;
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  // collection ID in Pythia's database
  discoveryCollectionId: string;
  discoveryCollectionType: DiscoveryCollectionTypes;
  // collection ID in Discovery service
  discoveryCollectionNativeId: string;
  discoveryUsername: string;
  discoveryPassword: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  discoveryEnvironmentId: string;
  useTranslit: boolean;
  nluUsername: string;
  nluPassword: string;
  nluApiKey: string;
  nluModelId: string;
  skipTraining: boolean;
}

export default async ({
  clientId,
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
  discoveryCollectionId,
  discoveryEnvironmentId,
  discoveryCollectionNativeId,
  discoveryApiKey,
  discoveryUrl,
  useTranslit,
  discoveryCollectionType,
  skipTraining,
  trainingId,
}: TrainCollectionParams) => {
  await cleanDiscoveryCollection({
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
  });

  const isMacrosCollection = !discoveryCollectionType || discoveryCollectionType === 'macros';

  if (isMacrosCollection) {
    await processMacros({
      useTranslit,
      discoveryCollectionId,
      discoveryEnvironmentId,
      discoveryCollectionNativeId,
      discoveryApiKey,
      discoveryUrl,
      clientId,
    });
  } else {
    await processShortcuts({
      clientId,
      useTranslit,
      discoveryCollectionId,
      discoveryEnvironmentId,
      discoveryCollectionNativeId,
      discoveryApiKey,
      discoveryUrl,
    });
  }

  if (skipTraining || !isMacrosCollection) {
    return [];
  }

  const { testing: testingEntities, training: trainingEntities } = await formTrainingEntities({
    clientId,
    discoveryCollectionId,
    trainingId,
    useTranslit,
  });

  // await saveJsonToTempFile('steps/01-trainingEntities.json', trainingEntities);
  // await saveJsonToTempFile('steps/02-testingEntities.json', testingEntities);

  const trainingEntitiesWithNegativeExamples = await addNegativeExamples(trainingEntities, {
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
  });

  // await saveJsonToTempFile('steps/03-trainingEntitiesWithNegativeExamples.json', trainingEntitiesWithNegativeExamples);

  const testingEntitiesWithUntrainedResults = await addTrainingResults(testingEntities, {
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
    isTrained: false,
  });

  // await saveJsonToTempFile('steps/04-testingEntitiesWithUntrainedResults.json', testingEntitiesWithUntrainedResults);

  await uploadTrainingData(trainingEntitiesWithNegativeExamples, {
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
  });

  await waitForTrainingCompletion({
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
  });

  const testingEntitiesWithTrainedResults = await addTrainingResults(testingEntitiesWithUntrainedResults, {
    discoveryCollectionId,
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
    isTrained: true,
  });

  // await saveJsonToTempFile('steps/05-testingEntitiesWithTrainedResults.json', testingEntitiesWithTrainedResults);

  await saveTrainingResults(testingEntitiesWithTrainedResults, {
    discoveryCollectionId,
  });

  return [];
};
