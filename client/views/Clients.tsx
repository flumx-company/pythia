import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import _map from 'lodash/map';
import _sortBy from 'lodash/sortBy';
import Button from '@/components/Button';
import AddClientForm from '@/components/AddClientForm';
import { showSuccess } from '@/services/notifications';
import ClientListItem from '@/components/ClientListItem';
import PageTitle from '@/components/PageTitle';
import Client from '@/types/client';

export const getClientsQuery = gql`
  query AllClientsQuery {
    allClients {
      id
      name
      description
      zendeskDomain
      createdAt
      collections {
        id
        name
        description
        clientId
        type
      }
    }
  }
`;

interface RemoveClientResponse {
  removeClient: string;
}

export default class Clients extends React.Component<any, any> {
  readonly state: any = {
    isAddingClient: false,
    trainingCollections: [],
    trainingStatus: [],
  };

  public handleAddButtonClick = () => {
    this.setState({
      ...this.state,
      isAddingClient: true,
    });
  }

  public handleAddClientCancel = () => {
    this.setState({
      ...this.state,
      isAddingClient: false,
    });
  }

  public handleClientAdded = (clientId: string) => {
    if (clientId) {
      showSuccess('Client added successfully.');

      this.setState({
        ...this.state,
        isAddingClient: false,
      });
    }
  }

  public handleClientRemoved({ removeClient }: RemoveClientResponse) {
    this.setState({
      ...this.state,
      isAddingClient: false,
      clients: this.state.clients.filter(({ id }: { id: string }) => id !== removeClient),
    });
  }

  public async handleCollectionTrainingStatusQuery({
    collectionId,
    trainingStatus,
  }: {
    collectionId: string,
    trainingStatus: string,
  }) {
    this.setState({
      trainingCollections: [
        {
          id: collectionId,
          status: trainingStatus,
        },
      ],
    });
  }

  render() {
    return (
      this.state.isAddingClient
        ? (
          <AddClientForm
            onCancel={this.handleAddClientCancel}
            onAdded={this.handleClientAdded}
          />
        ) : (
          <div>
            <div className="mb-8 text-right">
              <Button
                type="primary"
                onClick={this.handleAddButtonClick}
              >
                Add New Client
              </Button>
            </div>

            <PageTitle>Clients</PageTitle>

            <ul className="list-reset">
              <Query
                query={getClientsQuery}
              >
                {({ loading, error, data, refetch }) => {
                  if (!data || loading) {
                    return <div>loading...</div>;
                  }

                  if (error) {
                    return <div>error</div>;
                  }

                  const sortedClients = _sortBy(data.allClients, (client: Client) => -client.createdAt);
                  return _map(sortedClients, (client: Client) => (
                    <ClientListItem
                      key={client.id}
                      client={client}
                      refetchClients={refetch}
                    />
                  ));
                }}
              </Query>
            </ul>
          </div>
        )
    );
  }
}
