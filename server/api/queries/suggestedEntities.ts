import _ from 'lodash';
import { Client, DiscoveryCollection, Training } from '@/db/models';
import messages from '@/enums/messages';
import { toPlain } from '@/helpers/database';
import { translit, formatNaturalLanguageQuery } from '@/helpers/misc';
import config from '@/config';
import discovery from '@/providers/watson/discovery';
import shortcutsApi from '@/providers/zendesk/api/shortcuts';
import { addZendeskMetadataToDocuments } from '@/server/api/utils';

interface SuggestedMacrosData {
  count: number;
  natural_language_query: string;
  environmentId: string;
  collectionId: string;
  username?: string;
  password?: string;
  apiKey: string;
  url: string;
  filter?: string;
}

const {
  services: {
    watson: {
      // nlu: nluConfig,
      discovery: {
        maximumNaturalLanguageQueryLength,
      },
    },
  },
} = config;

interface SuggestedEntitiesQueryParams {
  text: string;
  clientId: string;
  type?: string;
}

export default async (
  obj: any,
  {
    text: ticketText,
    clientId,
    type,
  }: SuggestedEntitiesQueryParams,
) => {
  const dbClient = await Client.findOne({
    where: {
      id: clientId,
    },
    include: [{
      model: DiscoveryCollection,
      as: 'collections',
      include: [{
        model: Training,
      }],
    }],
  });

  if (!dbClient) {
    throw new Error(messages.CLIENT_NOT_FOUND);
  }

  const clientObject = toPlain(dbClient);
  const { collections } = clientObject;

  if (!collections || !collections.length) {
    throw new Error('Discovery collections not found.');
  }

  const collection = _.find(
    collections,
    ({ type: collectionType }) => collectionType === type,
  );

  if (!collection) {
    throw new Error(`Collection for ${type} not found.`);
  }

  const {
    discoveryEnvironmentId,
    discoveryUsername,
    discoveryPassword,
    discoveryApiKey,
    discoveryUrl,
    // nluApiKey,
    // nluUrl,
    zendeskChatApiToken,
  } = clientObject;

  const discoveryCollectionId = collection.discoveryId;

  const { trainings } = collection;

  const lastTraining = _(trainings).sortBy(({ trainedAt }) => new Date(trainedAt)).last();

  let useTranslit = false;

  if (lastTraining) {
    useTranslit = !!lastTraining.useTranslit;
  }

  const processedTicketText = formatNaturalLanguageQuery(useTranslit ? translit(ticketText) : ticketText);
  const shortenedTicketText = _.truncate(processedTicketText, {
    length: maximumNaturalLanguageQueryLength,
    separator: '.',
    omission: '.',
  });

  if (!shortenedTicketText) {
    return [];
  }

  const data = <SuggestedMacrosData>{
    count: 10,
    natural_language_query: shortenedTicketText,
    environmentId: discoveryEnvironmentId,
    collectionId: discoveryCollectionId,
    username: discoveryUsername,
    password: discoveryPassword,
    apiKey: discoveryApiKey,
    url: discoveryUrl,
  };

  // XXX: NLU model id is taken from collection, not client
  // if (nluModelId) {
  //   const { entities } = await nlu.analyze({
  //     'entities.model': nluModelId,
  //     features: 'entities',
  //     language: 'ru',
  //     text: processedTicketText,
  //   }, {
  //     baseURL: `${nluUrl}/${(nluConfig as any).apiVersion}`,
  //     auth: {
  //       username: 'apikey',
  //       password: nluApiKey,
  //     },
  //   });

  //   const filters = getFilterArray(entities);
  //   const filter = formFilterStringFromArray(filters);

  //   data.filter = filter;
  // }

  let results = [];
  let shortcuts: any[] = [];

  const dataPromises = [
    discovery.collections.query(data),
  ];

  if (type === 'shortcuts') {
    dataPromises.push(shortcutsApi.list({
      token: zendeskChatApiToken,
    }));
  }

  [{ results }, shortcuts = []] = await Promise.all(dataPromises);

  return addZendeskMetadataToDocuments(results, shortcuts, type);
};
