import React, { Fragment } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import _upperFirst from 'lodash/upperFirst';
import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import _filter from 'lodash/filter';
import _includes from 'lodash/includes';

import '@/views/Collection/Collection.pcss';
import { TableHeader as TableHeaderInterface } from '@/components/Table/TableHeader/TableHeader.d';

import TableHeader from '@/components/Table/TableHeader';
import TableBody from '@/components/Table/TableBody/TableBody';
import { Option } from '@/components/Select/Select.d';
// import Select from '@/components/Select';
import { RouteComponentProps } from 'react-router';

const collectionStatisticsQuery = gql`
  query CollectionStatistics(
    $id: String!
    $type: CollectionType
  ) {
    collectionStatistics(id: $id, type: $type) {
      entitiesInZendesk
      entitiesInDiscovery
    }
  }
`;

const headers: TableHeaderInterface[] = [
  { column: 'Document Title', field: 'title' },
  { column: 'Apply Automation', field: 'applyAutomation' },
  { column: 'Submit Automation', field: 'submitAutomation' },
  { column: 'Disable Submit Button', field: 'disableSubmitButton' },
];

interface CollectionAutomationProps {
  collection: any;
  options: Option[];
}

const CollectionAutomation: React.SFC<RouteComponentProps<{ id: string }> & CollectionAutomationProps> = ({ collection }) => {
  const { documents, client, id, type, trainings } = collection;

  _forEach(trainings, ({ trainedAt }, i) => {
    const num = i + 1;

    headers.push({
      column: `Training ${num} (${new Date(trainedAt).toLocaleDateString()})`,
      field: `training${num}`,
    });
  });

  return (
    <Fragment>
      <div styleName="table-wrapper">
        <Query query={collectionStatisticsQuery} variables={{ id, type }}>
          {({ loading, error, data }) => {
            if (loading || !data) {
              return <div styleName="status">Loading...</div>;
            }

            if (error) {
              return <div styleName="status">Error</div>;
            }

            const { collectionStatistics: { entitiesInZendesk, entitiesInDiscovery } } = data;

            const commonHeaders: TableHeaderInterface[] = [
              { column: `${_upperFirst(type)} in Zendesk`, field: `${type}InZendesk` },
              { column: `${_upperFirst(type)} in Discovery`, field: `${type}InDiscovery` },
              { column: 'Training Date', field: 'trainingDate' },
              { column: 'Cases with Rank 1', field: 'rank1' },
              { column: 'Cases with Rank 2-5', field: 'rank2-5' },
              { column: 'Cases with Rank >5', field: 'rank5' },
            ];

            const commonStatistics = [
              entitiesInZendesk,
              entitiesInDiscovery,
              'No data',
              'No data',
              'No data',
              'No data',
            ];

            return (
              <table className="w-full border-solid border mb-8">
                <TableHeader type="statistics" headers={commonHeaders} />
                <TableBody
                  type={'statistics'}
                  headers={commonHeaders}
                  items={commonStatistics}
                  errorMessage="no statistics"
                />
              </table>
            );
          }}
        </Query>

      </div>
      <div styleName="table-wrapper">
        <table className="w-full border-solid border">
          <TableHeader type="macros-list" headers={headers} />
          <TableBody
            type={'macros-list'}
            headers={headers}
            items={documents}
            domain={client.zendeskDomain}
            errorMessage="no data"
          />
        </table>
      </div>
    </Fragment>

  );
};

export default CollectionAutomation;
