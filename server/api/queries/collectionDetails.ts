import _ from 'lodash';
import { Client, DiscoveryCollection, DiscoveryDocument, Training, TrainingResult } from '@/db/models';
import { toPlain } from '@/helpers/database';

interface CollectionDetailsQueryParams {
  id: string;
}

export default async (parent: any, { id }: CollectionDetailsQueryParams) => {
  const discoveryCollection = toPlain(await DiscoveryCollection.findOne({
    where: {
      id,
    },
    include: [
      {
        model: DiscoveryDocument,
        as: 'documents',
      },
      { model: Client },
      {
        model: Training,
        include: [TrainingResult],
      },
    ],
  }));

  discoveryCollection.documents = _.map(discoveryCollection.documents, document => {
    if (!document.trainingResults) {
      document.trainingResults = [];
    }

    _.forEach(discoveryCollection.trainings, training => {
      const documentTrainingResult = _.find(
        training.trainingResults,
        trainingResult => trainingResult.discoveryDocumentId === document.id,
      );

      document.trainingResults.push(documentTrainingResult);
    });

    return document;
  });

  return discoveryCollection;
};
