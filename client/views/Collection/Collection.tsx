import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import PageTitle from '@/components/PageTitle';
import '@/views/Collection/Collection.pcss';
import { Option } from '@/components/Select/Select.d';
import Tabs from '@/components/Tabs';
import CollectionDetails from '@/views/Collection/CollectionDetails';
import CollectionTraining from '@/views/Collection/CollectionTraining';
import CollectionUsage from '@/views/Collection/CollectionUsage';

const collectionDetailsQuery = gql`
  query CollectionDetailsQuery($id: String!) {
    collectionDetails(id: $id) {
      id
      name
      type
      client {
        id
        zendeskDomain
      }
      documents {
        id
        title
        zendeskMacroId
        zendeskShortcutId
        trainingResults {
          id
          rankBeforeTraining
          rankAfterTraining
          scoreBeforeTraining
          scoreAfterTraining
          discoveryDocumentId
          zendeskTicketId
          trainingId
        }
      }
      trainings {
        id
        trainedAt
      }
    }
  }
`;

const renderCollectionUsage = ({ collection }: any) => (props: any) => (
  <CollectionUsage
    {...props}
    collection={collection}
  />
);

const renderCollectionTraining = ({ collection }: any) => (props: any) => (
  <CollectionTraining
    {...props}
    collection={collection}
  />
);

const renderCollectionDetails = ({ collection }: any) => (props: any) => (
  <CollectionDetails
    {...props}
    collection={collection}
  />
);

export default class Client extends Component<any, any> {
  collectionPrepare(collections: any[]): Option[] {
    return collections.map(e => ({ value: e.id, title: e.name }));
  }

  render() {
    const { params: { clientId, discoveryCollectionId }, url } = this.props.match;

    return (
      <Query query={collectionDetailsQuery} variables={{ id: discoveryCollectionId }}>
        {({ loading, error, data: { collectionDetails: collection } }) => {
          if (loading) {
            return <div>Loading...</div>;
          }

          if (error) {
            return <div>Error</div>;
          }

          const { name } = collection;

          return (
            <div>
              <PageTitle>{name}</PageTitle>

              <Tabs
                items={[{
                  title: 'Details',
                  href: `/clients/${clientId}/collections/${discoveryCollectionId}`,
                  type: 'details',
                }, {
                  title: 'Training',
                  href: `${url}/training`,
                  type: 'training',
                }, {
                  title: 'Usage',
                  href: `${url}/usage`,
                  type: 'usage',
                  disabled: true,
                }]}
              />

              <Switch>
                <Route
                  path="/clients/:clientId/collections/:discoveryCollectionId"
                  render={renderCollectionDetails({ collection })}
                  exact={true}
                />
                <Route
                  path="/clients/:clientId/collections/:discoveryCollectionId/usage"
                  render={renderCollectionUsage({ collection })}
                />
                <Route
                  path="/clients/:clientId/collections/:discoveryCollectionId/training"
                  render={renderCollectionTraining({ collection })}
                />
              </Switch>
            </div>
          );
        }}
      </Query>
    );
  }
}
