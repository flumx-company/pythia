import React from 'react';
import gql from 'graphql-tag';
import _map from 'lodash/map';
import _omit from 'lodash/omit';
import { Query } from 'react-apollo';
import { PythiaDiscoveryCollection } from '@/../types/pythia';
import Table from '@/components/BetterTable/Table';

interface CollectionTrainingProps {
  collection: PythiaDiscoveryCollection;
}

const collectionTrainingQuery = gql`
  query CollectionTrainingQuery(
    $id: String!
  ) {
    collectionTraining(id: $id) {
      label
      value
    }
  }

`;

const CollectionTraining: React.SFC<CollectionTrainingProps> = ({ collection: { id } }) => (
  <Query query={collectionTrainingQuery} variables={{ id }}>
    {({ loading, error, data: { collectionTraining } }) => {
      if (loading) {
        return <div>Loading...</div>;
      }

      if (error) {
        return <div>Error</div>;
      }

      const data = _map(collectionTraining, (value: any) => _omit(value, ['__typename']));

      return (
        <Table data={data} />
      );
    }}
  </Query>
);

export default CollectionTraining;
