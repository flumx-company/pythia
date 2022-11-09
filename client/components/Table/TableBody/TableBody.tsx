import React, { Fragment } from 'react';

import { TableBodyProps } from '@/components/Table/TableBody/TableBody.d';
import '@/components/Table/TableBody/TableBody.pcss';

import TableRow from '@/components/Table/TableRow';
import TableRowAnalytics from '@/components/Table/TableRowAnalytics';
import TableRowMacros from '@/components/Table/TableRowMacros/TableRowMacros';

const TableBody: React.FunctionComponent<TableBodyProps> = ({
  type,
  items,
  domain,
  headers,
  errorMessage,
}) => {
  const renderTableBody = () => {
    if (type === 'macros-list') {
      return (
        items.map((item: any, i: number) => (
          <TableRow key={i} document={item} domain={domain} />
        ))
      );
    }

    if (type === 'statistics') {
      return (
        <TableRowAnalytics statistics={items} />
      );
    }

    if (type === 'macros-usage') {
      return (
        <Fragment>
          {items.map((item: any, i: number) => (
            <TableRowMacros key={i} usages={item} domain={domain} />
          ))}
          <tr styleName="row-total">
            <td styleName="text-total">total</td>
            <td className="text-center">123</td>
            <td className="text-center">123</td>
            <td className="text-center">123</td>
            <td className="text-center">123</td>
            <td className="text-center">492</td>
          </tr>
        </Fragment>
      );
    }
  };

  if (items && items.length > 0) {
    return (
      <tbody>
        {renderTableBody()}
      </tbody>
    );
  }

  return (
    <tbody>
      <tr>
        <td colSpan={headers.length} styleName="row-error">{errorMessage}</td>
      </tr>
    </tbody>
  );

};

export default TableBody;
