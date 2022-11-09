import _ from 'lodash';
import discovery from '@/providers/watson/discovery';
import { Client, DiscoveryCollection } from '@/db/models';
import logger from '@/helpers/logger';

export default async (root: any, args: any) => {
  const clientData = {
    name: args.name,
    description: args.description,
    discoveryUsername: args.discoveryUsername,
    discoveryPassword: args.discoveryPassword,
    discoveryApiKey: args.discoveryApiKey,
    discoveryUrl: args.discoveryUrl,
    discoveryEnvironmentId: args.discoveryEnvironmentId,
    discoveryConfigurationId: args.discoveryConfigurationId,
    createDiscoveryCollection: args.createDiscoveryCollection,
    discoveryCollectionId: args.discoveryCollectionId,
    createShortcutsDiscoveryCollection: args.createShortcutsDiscoveryCollection,
    shortcutsDiscoveryCollectionId: args.shortcutsDiscoveryCollectionId,
    nluUsername: args.nluUsername,
    nluPassword: args.nluPassword,
    nluApiKey: args.nluApiKey,
    nluModelId: args.nluModelId,
    zendeskDomain: args.zendeskDomain,
    zendeskUsername: args.zendeskUsername,
    zendeskApiToken: args.zendeskApiToken,
    zendeskChatPassword: args.zendeskChatPassword,
    zendeskChatApiToken: args.zendeskChatApiToken,
  };

  // XXX: add schema validation or use Apollo validation
  if (
    !clientData.name ||
    !clientData.discoveryUrl ||
    !clientData.discoveryEnvironmentId ||
    !clientData.discoveryConfigurationId ||
    !clientData.discoveryApiKey ||
    !clientData.zendeskDomain ||
    !clientData.zendeskUsername ||
    !clientData.zendeskApiToken
  ) {
    throw new Error('Please fill all required fields.');
  }

  if (clientData.zendeskChatPassword && !clientData.zendeskChatApiToken) {
    throw new Error('Please add Zendesk Chat API token or clear Zendesk Chat password field.');
  }

  let discoveryCollection;

  // if user neither checked 'create new collection' checkbox
  // nor provided collection ID, skip collection handling
  if (clientData.createDiscoveryCollection || clientData.discoveryCollectionId) {
    if (!clientData.discoveryCollectionId) {
      try {
        discoveryCollection = await discovery.collections.create({
          name: `${clientData.name} (Macros)`,
          description: clientData.description,
          environmentId: clientData.discoveryEnvironmentId,
          configurationId: clientData.discoveryConfigurationId,
          username: clientData.discoveryUsername,
          password: clientData.discoveryPassword,
          apiKey: clientData.discoveryApiKey,
          url: clientData.discoveryUrl,
        } as any);

        clientData.discoveryCollectionId = discoveryCollection.collection_id;
      } catch (err) {
        throw new Error(
          _.get(err, 'response.data.error') ||
          (err && err.message) ||
          'Creating of Discovery collection for macros failed.',
        );
      }
    }
  }

  let shortcutsDiscoveryCollectionId;

  if (clientData.createShortcutsDiscoveryCollection || clientData.shortcutsDiscoveryCollectionId) {
    if (!clientData.shortcutsDiscoveryCollectionId) {
      try {
        shortcutsDiscoveryCollectionId = await discovery.collections.create({
          name: `${clientData.name} (Shortcuts)`,
          description: clientData.description,
          environmentId: clientData.discoveryEnvironmentId,
          configurationId: clientData.discoveryConfigurationId,
          username: clientData.discoveryUsername,
          password: clientData.discoveryPassword,
          apiKey: clientData.discoveryApiKey,
          url: clientData.discoveryUrl,
        } as any);

        clientData.shortcutsDiscoveryCollectionId = shortcutsDiscoveryCollectionId.collection_id;
      } catch (err) {
        // after shortcuts collection has errored, delete newly created macros collection as well
        if (clientData.createDiscoveryCollection) {
          await discovery.collections.delete(clientData.discoveryCollectionId, {
            environmentId: clientData.discoveryEnvironmentId,
            username: clientData.discoveryUsername,
            password: clientData.discoveryPassword,
            apiKey: clientData.discoveryApiKey,
            url: clientData.discoveryUrl,
          } as any);
        }

        throw new Error(
          _.get(err, 'response.data.error') ||
          (err && err.message) ||
          'Creating of Discovery collection for shortcuts failed.',
        );
      }
    }
  }

  let dbCollection;

  const macrosCollectionResponse = await DiscoveryCollection.findOrCreate({
    where: {
      discoveryId: clientData.discoveryCollectionId,
    },
    defaults: {
      name: `${clientData.name} (Macros)`,
      description: clientData.description,
      isDefault: true,
      nluModelId: clientData.nluModelId || null,
      type: 'macros',
    },
  });

  dbCollection = macrosCollectionResponse[0];

  let dbShortcutsCollection;

  const shortcutsCollectionResponse = await DiscoveryCollection.findOrCreate({
    where: {
      discoveryId: clientData.shortcutsDiscoveryCollectionId,
    },
    defaults: {
      name: `${clientData.name} (Shortcuts)`,
      description: clientData.description,
      isDefault: false,
      nluModelId: clientData.nluModelId || null,
      type: 'shortcuts',
    },
  });

  dbShortcutsCollection = shortcutsCollectionResponse[0];

  let dbClient;
  try {
    dbClient = await Client.create(clientData);

    if (dbCollection) {
      await dbClient.addCollection(dbCollection);
    }

    if (dbShortcutsCollection) {
      await dbClient.addCollection(dbShortcutsCollection);
    }
  } catch (err) {
    if (clientData.createDiscoveryCollection) {
      await DiscoveryCollection.destroy({
        where: {
          discoveryId: clientData.discoveryCollectionId,
        },
      });

      await discovery.collections.delete(clientData.discoveryCollectionId, {
        environmentId: clientData.discoveryEnvironmentId,
        username: clientData.discoveryUsername,
        password: clientData.discoveryPassword,
        apiKey: clientData.discoveryApiKey,
        url: clientData.discoveryUrl,
      } as any);
    }

    if (clientData.createShortcutsDiscoveryCollection) {
      await DiscoveryCollection.destroy({
        where: {
          discoveryId: clientData.shortcutsDiscoveryCollectionId,
        },
      });

      await discovery.collections.delete(clientData.shortcutsDiscoveryCollectionId, {
        environmentId: clientData.discoveryEnvironmentId,
        username: clientData.discoveryUsername,
        password: clientData.discoveryPassword,
        apiKey: clientData.discoveryApiKey,
        url: clientData.discoveryUrl,
      } as any);
    }

    logger.error(err.errors || err);
    const firstErrorMessage = err.errors && err.errors[0].message;
    throw new Error(firstErrorMessage);
  }

  return dbClient.dataValues;
};
