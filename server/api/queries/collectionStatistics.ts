import _ from 'lodash';
import { Client, DiscoveryCollection } from '@/db/models';
import { PythiaDiscoveryCollectionType } from '@/types/pythia';
import macros from '@/services/macros';
import shortcutsApi from '@/providers/zendesk/api/shortcuts';
import discovery from '@/providers/watson/discovery';
import { toPlain } from '@/helpers/database';

interface ClientQueryParams {
  id: string;
  type: PythiaDiscoveryCollectionType;
  discoveryCollectionId: string;
}
export default async (parent: any, { id, type }: ClientQueryParams) => {
  const discoveryCollection = toPlain(await DiscoveryCollection.findOne({
    where: {
      id,
    },
    include: [{
      model: Client,
    }],
  }));

  const { client } = discoveryCollection;

  let entitiesInZendeskRequest;

  if (type === 'macros') {
    entitiesInZendeskRequest = macros.getAll({
      username: client.zendeskUsername,
      url: client.zendeskDomain,
      token: client.zendeskApiToken,
    });
  } else {
    entitiesInZendeskRequest = shortcutsApi.list({
      token: client.zendeskChatApiToken,
    });
  }

  const collectionDetailsRequest = await discovery.collections.listDetails({
    environmentId: discoveryCollection.client.discoveryEnvironmentId,
    collectionId: discoveryCollection.discoveryId,
    apiKey: discoveryCollection.client.discoveryApiKey,
    url: discoveryCollection.client.discoveryUrl,
  });

  const [
    entitiesInZendesk,
    { document_counts: { available } },
  ] = await Promise.all([entitiesInZendeskRequest, collectionDetailsRequest]);

  return {
    entitiesInZendesk: _.size(entitiesInZendesk),
    entitiesInDiscovery: available,
  };
};
