import React from 'react';

import { TableHeaderProps } from '@/components/Table/TableHeader/TableHeader.d';
import '@/components/Table/TableHeader/TableHeader.pcss';

const TableHeader: React.SFC<TableHeaderProps> = ({ headers, type }) => {
  return (
    <thead>
      <tr
        styleName={`${type === 'macros-list' ? 'header-title' : ''}`}
        className={`border-b-4 ${
          type === 'macros-list' || type === 'macros-usage'
            ? 'border-blue-light' : 'border-red-lighter'
          }`}
      >
        {headers.map((header, idx) => (
          <th
            className={`${
              idx === 0 && type === 'macros-list' || idx === 0 && type === 'macros-usage' ? 'text-left' : ''
              } p-2`}
            key={header.field}
          >
            {header.column}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
