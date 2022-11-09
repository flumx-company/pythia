import React from 'react';

import { TableRowAnalyticsProps } from '@/components/Table/TableRowAnalytics/TableRowAnalytics.d';
import '@/components/Table/TableRow/TableRow.pcss';

const TableRowAnalytics: React.FunctionComponent<TableRowAnalyticsProps> = ({ statistics }) => {
  return (
    <tr styleName="table-body">
      {statistics.map((row, idx) => {
        return (
          <td key={idx} className="p-2 text-center">
            {row}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRowAnalytics;
