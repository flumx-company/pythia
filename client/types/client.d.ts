import Collection from './collection';

export default interface Client {
  id: string;
  name: string;
  description: string;
  zendeskDomain: string;
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskChatPassword: string;
  zendeskChatApiToken: string;
  discoveryEnvironmentId: string;
  discoveryConfigurationId: string;
  createdAt: string;
  collections: Collection[];
}
