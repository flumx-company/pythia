import _ from 'lodash';
import { toPlain } from '@/helpers/database';
import { Client, DiscoveryCollection } from '@/db/models';

export default async () => {
  const clients = toPlain(await Client.findAll({
    include: [{
      model: DiscoveryCollection,
      as: 'collections',
    }],
  }));

  return _.map(clients, client => {
    return {
      ...client,
      collections: _.sortBy(client.collections, ({ type }) => type),
    };
  });
};
