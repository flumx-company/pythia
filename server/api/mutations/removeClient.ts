import _ from 'lodash';
import {
  DiscoveryDocument,
  DiscoveryCollection,
  Client,
  Training,
  TrainingResult,
  ZendeskTicket,
  ZendeskTicketAudit,
  ZendeskTicketAuditEvent,
  ZendeskTicketForm,
  ZendeskMacro,
  ZendeskShortcut,
} from '@/db/models';
import discovery from '@/providers/watson/discovery';
import logger from '@/helpers/logger';
import { map, settleAll } from 'blend-promise-utils';

export default async (root: any, { id, removeDiscoveryCollections }: any) => {
  const client = await Client.findOne({
    where: {
      id,
    },
    include: [{
      model: DiscoveryCollection,
      as: 'collections',
    }],
  });

  if (removeDiscoveryCollections) {
    try {
      await map(client.collections, async collection => {
        await discovery.collections.delete(collection.discoveryId, {
          environmentId: client.discoveryEnvironmentId,
          apiKey: client.discoveryApiKey,
          url: client.discoveryUrl,
        });
      });
    } catch (err) {
      logger.error(err);
    }
  }

  const clientId = client.id;

  // remove Zendesk stuff
  await settleAll([
    ZendeskTicket.destroy({
      where: { clientId },
    }),

    ZendeskTicketAudit.destroy({
      where: { clientId },
    }),

    ZendeskTicketAuditEvent.destroy({
      where: { clientId },
    }),

    ZendeskTicketForm.destroy({
      where: {
        clientId: client.id,
      },
    }),

    ZendeskMacro.destroy({
      where: {
        clientId: client.id,
      },
    }),

    ZendeskShortcut.destroy({
      where: {
        clientId: client.id,
      },
    }),
  ]);

  // remove documents and training data for each collection
  await map(client.collections, async collection => {
    const trainings = await Training.findAll({
      where: {
        discoveryCollectionId: collection.id,
      },
    });

    const trainingIds = _.map(trainings, 'id');

    await DiscoveryDocument.destroy({
      where: {
        discoveryCollectionId: collection.id,
      },
    });

    await TrainingResult.destroy({
      where: {
        trainingId: trainingIds,
      },
    });

    await Training.destroy({
      where: {
        id: trainingIds,
      },
    });
  });

  await DiscoveryCollection.destroy({
    where: {
      id: _.map(client.collections, 'id'),
    },
  });

  // remove db client
  const res = await Client.destroy({
    where: { id },
  });

  return res ? id : false;
};
