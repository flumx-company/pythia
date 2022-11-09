import gql from 'graphql-tag';

// TODO: combine mutation with server-side one
export default gql`
  mutation AddClientMutation(
    $name: String!,
    $description: String,
    $discoveryUsername: String,
    $discoveryPassword: String,
    $discoveryApiKey: String,
    $discoveryUrl: String!,
    $discoveryEnvironmentId: String!,
    $discoveryConfigurationId: String!,
    $createDiscoveryCollection: Boolean,
    $discoveryCollectionId: String,
    $createShortcutsDiscoveryCollection: Boolean,
    $shortcutsDiscoveryCollectionId: String,
    $nluUsername: String,
    $nluPassword: String,
    $nluApiKey: String,
    $nluModelId: String,
    $zendeskDomain: String!,
    $zendeskUsername: String!,
    $zendeskApiToken: String!,
    $zendeskChatPassword: String!,
    $zendeskChatApiToken: String,
  ) {
    addClient(
      name: $name,
      description: $description,
      discoveryUsername: $discoveryUsername,
      discoveryPassword: $discoveryPassword,
      discoveryApiKey: $discoveryApiKey,
      discoveryUrl: $discoveryUrl,
      createDiscoveryCollection: $createDiscoveryCollection,
      discoveryCollectionId: $discoveryCollectionId,
      createShortcutsDiscoveryCollection: $createShortcutsDiscoveryCollection,
      shortcutsDiscoveryCollectionId: $shortcutsDiscoveryCollectionId,
      discoveryEnvironmentId: $discoveryEnvironmentId,
      discoveryConfigurationId: $discoveryConfigurationId,
      nluUsername: $nluUsername,
      nluPassword: $nluPassword,
      nluApiKey: $nluApiKey,
      nluModelId: $nluModelId,
      zendeskDomain: $zendeskDomain,
      zendeskUsername: $zendeskUsername,
      zendeskApiToken: $zendeskApiToken,
      zendeskChatPassword: $zendeskChatPassword,
      zendeskChatApiToken: $zendeskChatApiToken,
    ) {
      id
      name
      description
      discoveryUsername
      discoveryPassword
      discoveryApiKey
      discoveryUrl
      createDiscoveryCollection
      discoveryCollectionId
      createShortcutsDiscoveryCollection
      shortcutsDiscoveryCollectionId
      discoveryEnvironmentId
      discoveryConfigurationId
      nluUsername
      nluPassword
      nluApiKey
      nluModelId
      zendeskDomain
      zendeskUsername
      zendeskApiToken
      zendeskChatPassword
      zendeskChatApiToken
      collections {
        id
      }
    }
  }
`;
