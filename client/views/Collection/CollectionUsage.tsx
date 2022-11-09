import React, { Fragment } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

import '@/views/Collection/Collection.pcss';
import { TableHeader as TableHeaderInterface } from '@/components/Table/TableHeader/TableHeader.d';

import TableHeader from '@/components/Table/TableHeader';
import TableBody from '@/components/Table/TableBody/TableBody';
// import Select from '@/components/Select';

const clientQuery = gql`
  query ClientQuery($id: String!, $discoveryCollectionId: String) {
    client(id: $id) {
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
        discoveryId
      }
    }
    documentsByCollection(discoveryCollectionId: $discoveryCollectionId) {
      id
      title
      zendeskMacroId
      applyAutomation
      submitAutomation
      disableSubmitButton
    }
    statistic(id: $id, discoveryCollectionId: $discoveryCollectionId) {
      macrosInZendesk
      macrosInDiscovery
    }
  }
`;

const usagesHeaders: TableHeaderInterface[] = [
  { column: 'Macro Title', field: 'macroTitle' },
  { column: 'Agent 1', field: 'agent1' },
  { column: 'Agent 2', field: 'agent2' },
  { column: 'Agent 3', field: 'agent3' },
  { column: 'Agent X', field: 'agentX' },
  { column: 'Total', field: 'total' },
];

// const selectOptions = [
//   { title: 'Date', value: 'date' },
//   { title: 'Brand', value: 'brand' },
//   { title: 'Form', value: 'form' },
//   { title: 'Group', value: 'group' },
// ];

interface CollectionStatisticsProps {
  data: any;
  discoveryCollectionId: string;
}

const CollectionStatistics: React.SFC<CollectionStatisticsProps> = ({ data, discoveryCollectionId }) => {
  const id = data.client.id;
  // const handleFilterSelectChange = () => {};

  return (
    <Query query={clientQuery} variables={{ id, discoveryCollectionId }}>
      {({ loading, error, data: clientQueryData }) => {
        if (loading) {
          return <div>Loading...</div>;
        }

        if (error) {
          return <div>Error</div>;
        }

        return (
          <Fragment>
            {/* <Select
              name="filter"
              label="Select filter value"
              options={selectOptions}
              onChange={handleFilterSelectChange}
              value={discoveryCollectionId || ''}
            /> */}
            <div styleName="table-wrapper">
              <table className="w-full border-solid border mb-8">
                <TableHeader type="macros-usage" headers={usagesHeaders} />
                <TableBody
                  type={'macros-usage'}
                  headers={usagesHeaders}
                  items={clientQueryData.documentsByCollection}
                  domain={clientQueryData.client.zendeskDomain}
                  errorMessage="no macros usage"
                />
              </table>
            </div>
          </Fragment>
        );
      }}
    </Query>
  );
};

export default CollectionStatistics;
