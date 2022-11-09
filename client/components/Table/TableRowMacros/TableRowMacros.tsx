import React from 'react';

import { TableRowMacrosProps } from '@/components/Table/TableRowMacros/TableRowMacros.d';
import '@/components/Table/TableRow/TableRow.pcss';

const TableRowMacros: React.FunctionComponent<TableRowMacrosProps> = ({ usages, domain }) => {
  const { title, zendeskMacroId, zendeskShortcutId } = usages;
  const zendeskEntityId = zendeskMacroId || zendeskShortcutId;

  return (
    <tr styleName="table-body">
      <td className="p-2">
        <a
          styleName="macros-href"
          href={`https://${domain}.zendesk.com/agent/admin/macros/${zendeskEntityId}`}
        >
          {title}
        </a>
      </td>
      <td className="text-center">22</td>
      <td className="text-center">44</td>
      <td className="text-center">22</td>
      <td className="text-center">44</td>
      <td className="text-center">132</td>
    </tr>
  );
};

export default TableRowMacros;
