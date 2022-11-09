import _ from 'lodash';
import { format } from 'date-fns';
import { Client, DiscoveryCollection } from '@/db/models';
import discovery from '@/providers/watson/discovery';

interface CollectionDetailsQueryParams {
  id: string;
}

export default async (parent: any, { id }: CollectionDetailsQueryParams) => {
  const discoveryCollection = await DiscoveryCollection.findOne({
    where: {
      id,
    },
    include: [{
      model: Client,
    }],
  });

  const { training_status: trainingStatus } = await discovery.collections.listDetails({
    environmentId: discoveryCollection.client.discoveryEnvironmentId,
    collectionId: discoveryCollection.discoveryId,
    apiKey: discoveryCollection.client.discoveryApiKey,
    url: discoveryCollection.client.discoveryUrl,
  });

  const parseValue = (value: any): string => {
    if (_.isBoolean(value)) {
      return value ? 'Yes' : 'No';
    }

    if (_.isString(value)) {
      if (Date.parse(value)) {
        return format(new Date(value), 'HH:mm DD.MM.YYYY');
      }

      if (!value) {
        return '—';
      }
    }

    return value;
  };

  return _.map(trainingStatus, (value, key) => ({
    value: parseValue(value),
    label: _.startCase(key),
  }));
};
