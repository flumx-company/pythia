import React from 'react';
import _map from 'lodash/map';
import _keys from 'lodash/keys';
import _values from 'lodash/values';
import _startCase from 'lodash/startCase';
import '@/components/BetterTable/Table.pcss';

interface TableProps {
  data: any[];
}

const CollectionTraining: React.SFC<TableProps> = ({ data }) => {
  const tableHeaders = _map(_keys(data[0]), _startCase);

  return (
    <table styleName="table">
      <thead styleName="table-head">
        <tr styleName="table-row">
          {tableHeaders.map((label, key) => (
            <th key={key} styleName="table-cell">{label}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((obj, key) => {
          const rowStyleName = key % 2 ? 'table-row-odd' : '';

          return (
            <tr key={key} styleName={rowStyleName}>
              {_values(obj).map((value, valueKey) => (
                <td key={valueKey} styleName="table-cell">{value}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default CollectionTraining;
