import React, { useState } from 'react';
import { Mutation } from 'react-apollo';
import _map from 'lodash/map';

import { TableRowProps } from '@/components/Table/TableRow/TableRow.d';
import '@/components/Table/TableRow/TableRow.pcss';

import Checkbox from '@/components/Checkbox';
import gql from 'graphql-tag';

const updateDiscoveryDocument = gql`
  mutation UpdateDiscoveryDocument(
    $id: String
    $applyAutomation: Boolean
    $submitAutomation: Boolean
    $disableSubmitButton: Boolean
  ) {
    updateDiscoveryDocument(
      id: $id
      applyAutomation: $applyAutomation
      submitAutomation: $submitAutomation
      disableSubmitButton: $disableSubmitButton
    ) {
      id
      title
    }
  }
`;

const TableRow: React.FunctionComponent<TableRowProps> = ({ document, domain }) => {
  const {
    id,
    title,
    zendeskMacroId,
    applyAutomation: applyAuto,
    submitAutomation: submitAuto,
    disableSubmitButton: disableSubmit,
    trainingResults,
  } = document;
  const [applyAutomation, setApplyAuto] = useState(applyAuto || false);
  const [submitAutomation, setSubmitAuto] = useState(submitAuto || false);
  const [disableSubmitButton, setDisable] = useState(disableSubmit || false);

  const checkHandler = (
    state: boolean,
    update: any,
    setFunc: Function,
    fieldName: string,
  ) => async () => {
    const variables = { variables: { id, [fieldName]: !state } };
    await update(variables);
    setFunc(!state);
  };

  return (
    <Mutation mutation={updateDiscoveryDocument}>
      {update => (
        <tr styleName="table-body">
          <td className="p-2">
            <a
              styleName="macros-href"
              href={`https://${domain}.zendesk.com/agent/admin/macros/${zendeskMacroId}`}
            >
              {title}
            </a>
          </td>
          <td>
            <div className="flex justify-center w-32">
              <Checkbox
                name="applyAutomation"
                checked={applyAutomation}
                onChange={checkHandler(
                  applyAutomation,
                  update,
                  setApplyAuto,
                  'applyAutomation',
                )}
              />
            </div>
          </td>
          <td>
            <div className="flex justify-center w-32">
              <Checkbox
                name="submitAutomation"
                checked={submitAutomation}
                onChange={checkHandler(
                  submitAutomation,
                  update,
                  setSubmitAuto,
                  'submitAutomation',
                )}
              />
            </div>
          </td>
          <td>
            <div className="flex justify-center w-32">
              <Checkbox
                name="disableSubmitButton"
                checked={disableSubmitButton}
                onChange={checkHandler(
                  disableSubmitButton,
                  update,
                  setDisable,
                  'disableSubmitButton',
                )}
              />
            </div>
          </td>
          {_map(trainingResults, (trainingResult, i) => {
            const value = trainingResult
              ? `${trainingResult.rankBeforeTraining || '-'} / ${trainingResult.rankAfterTraining || '-'}`
              : '-';

            return (
              <td key={i} className="text-center whitespace-no-wrap">{value}</td>
            );
          })}
        </tr>
      )}
    </Mutation>
  );
};

export default TableRow;
