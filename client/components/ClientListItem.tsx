import React from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import copy from 'copy-text-to-clipboard';
import Button from '@/components/Button';
import { showSuccess } from '@/services/notifications';
import CollectionListItem from '@/components/CollectionListItem';
import Checkbox from '@/components/Checkbox';
import Client from '@/types/client';
import classNames from 'classnames';
import Label from '@/components/Label';
import JobStatusStep from '@/components/JobStatusStep';

import '@/components/ClientListItem.pcss';

export interface ClientListItemState {
  removeDiscoveryCollections: boolean;
  isClientIdCopied: boolean;
}

export interface ClientListItemProps {
  client: Client;
  // XXX: get rid of generic Function
  refetchClients: Function;
}

const importZendeskDataMutation = gql`
  mutation ImportZendeskDataMutation(
    $id: String,
  ) {
    importZendeskData(
      id: $id,
    )
  }
`;

const zendeskDataImportStatusQuery = gql`
  query ZendeskDataImportStatusQuery(
    $clientId: String,
  ) {
    zendeskDataImportStatus(
      clientId: $clientId,
    ) {
      steps {
        label
        output
        type
        substeps {
          label
        }
      }
      error
      started
      ended
      offed
    }
  }
`;

const zendeskDataImportStatusSubscription = gql`
  subscription ZendeskDataImportStatusSubscription(
    $clientId: String,
  ) {
    zendeskDataImportStatus(
      clientId: $clientId,
    ) {
      steps {
        label
        output
        type
        substeps {
          label
        }
      }
      error
      started
      ended
      offed
    }
  }
`;

const resetZendeskDataImportMutation = gql`
  mutation ResetZendeskDataImportMutation(
    $id: String,
  ) {
    resetZendeskDataImport(
      id: $id,
    )
  }
`;

const removeClientMutation = gql`
  mutation RemoveClientMutation(
    $id: String,
    $removeDiscoveryCollections: Boolean,
  ) {
    removeClient(
      id: $id,
      removeDiscoveryCollections: $removeDiscoveryCollections,
    )
  }
`;

export default class ClientListItem extends React.Component<ClientListItemProps, ClientListItemState> {
  state = {
    removeDiscoveryCollections: false,
    isClientIdCopied: false,
  };

  handleRemoveDiscoveryCollectionshChange = (event: any) => {
    this.setState({
      removeDiscoveryCollections: event.target.checked,
    });
  }

  handleClientNameClick = (event: React.MouseEvent<HTMLElement>) => {
    copy(this.props.client.id);

    this.setState({
      isClientIdCopied: true,
    });

    setTimeout(() => {
      this.setState({
        isClientIdCopied: false,
      });
    }, 3000);
  }

  handleRemoveClientResult = () => {
    showSuccess('Client removed successfully.');
    this.props.refetchClients();
  }

  handleRemoveClientButtonClick = (removeClientFn: () => any) => () => {
    if (window.confirm('Are you sure you want to remove this client?')) {
      removeClientFn();
    }
  }

  handleImportZendeskDataButtonClick = (importZendeskDataFn: any) => (event: any) => {
    importZendeskDataFn();
  }

  handleProceedButtonClick = (resetZendeskDataImportFn: any) => (event: any) => {
    resetZendeskDataImportFn();
  }

  subscribeToImportStatus = (subscribeToMore: (arg: any) => any, variables: any) => {
    return subscribeToMore({
      variables,
      document: zendeskDataImportStatusSubscription,
      updateQuery: (prev: any, { subscriptionData: { data } }: any) => {
        if (!data) {
          return prev;
        }

        return data;
      },
    });
  }

  render() {
    const { client } = this.props;
    const clientId = client.id;
    const { removeDiscoveryCollections, isClientIdCopied } = this.state;

    // const url = `/clients/${client.id}/collections/${client.collections.find(e => e.type === 'macros')!.id}`;
    return (
      <li className="my-4 bg-grey-lightest p-4" key={client.id}>
        <div className="flex">
          <div className="flex flex-col items-start flex-grow">
            <div className="flex items-center">
              <h3 className="text-grey-darkest">{client.name}</h3>

              <a
                className="client-list-item-link"
                onClick={this.handleClientNameClick}
              >
                {client.id}
              </a>

              <span
                className={classNames('client-list-item-copy', {
                  'copy-visible': isClientIdCopied,
                })}
              >
                Copied!
              </span>
            </div>

            <div className="mt-4">
              <Query
                query={zendeskDataImportStatusQuery}
                variables={{ clientId }}
              >
                {
                  ({ data, subscribeToMore }) => {
                    this.subscribeToImportStatus(subscribeToMore, { clientId });

                    if (!data || !data.zendeskDataImportStatus) {
                      return (
                        <div>Loading...</div>
                      );
                    }

                    const { zendeskDataImportStatus } = data;
                    const importCompleted = zendeskDataImportStatus.ended && !zendeskDataImportStatus.error;
                    const importHasErrors = zendeskDataImportStatus.error;

                    let labelType;
                    let labelText = 'Import in progress';

                    if (importHasErrors) {
                      labelType = 'error';
                      labelText = 'Import errored';
                    } else if (importCompleted) {
                      labelType = 'success';
                      labelText = 'Import succeeded';
                    }

                    return (
                      <div>
                        {zendeskDataImportStatus.started ? (
                          <div className="flex items-center">
                            <div className="flex mr-2">
                              <Label
                                text={labelText}
                                type={labelType as any}
                              />
                            </div>

                            {
                              (importCompleted || importHasErrors) && (
                                <Mutation
                                  mutation={resetZendeskDataImportMutation}
                                  variables={{
                                    id: clientId,
                                  }}
                                >
                                  {resetZendeskDataImport => (
                                    <Button
                                      size="xs"
                                      type="primary"
                                      onClick={this.handleProceedButtonClick(resetZendeskDataImport)}
                                    >
                                      Proceed
                                    </Button>
                                  )}
                                </Mutation>
                              )
                            }
                          </div>
                        ) : (
                          <Mutation
                            mutation={importZendeskDataMutation}
                            variables={{
                              id: client.id,
                            }}
                          >
                            {importZendeskData => (
                              <Button
                                type="primary"
                                size="xs"
                                onClick={this.handleImportZendeskDataButtonClick(importZendeskData)}
                              >
                                Import Zendesk Data
                              </Button>
                            )}
                          </Mutation>
                        )}

                        {zendeskDataImportStatus.started && (
                          <div className="my-4">
                            {zendeskDataImportStatus.steps && zendeskDataImportStatus.steps.map((step: any, index: number) => {
                              const isSuccess = step.type === 'success';
                              const isError = step.type === 'error';

                              return (
                                <JobStatusStep
                                  key={index}
                                  step={step}
                                  success={isSuccess}
                                  error={isError}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                }
              </Query>
            </div>
          </div>

          <div className="ml-4 flex flex-col items-end">
            <div>
              <Mutation
                mutation={removeClientMutation}
                variables={{
                  removeDiscoveryCollections,
                  id: client.id,
                }}
                // XXX: use 'update' prop here instead of refetch
                onCompleted={this.handleRemoveClientResult}
              >
                {(removeClient, { loading }) => {
                  const buttonType = loading ? undefined : 'danger';
                  const buttonLabel = loading ? 'Removing' : 'Remove';

                  return (
                    <Button
                      type={buttonType}
                      disabled={loading}
                      size="xs"
                      inverted={true}
                      onClick={this.handleRemoveClientButtonClick(removeClient)}
                    >
                      {buttonLabel}
                    </Button>
                  );
                }
                }
              </Mutation>
            </div>

            <div className="text-grey-dark text-sm mx-2">
              <Checkbox
                name="removeDiscoveryCollections"
                label="with Discovery collections"
                checked={removeDiscoveryCollections}
                onChange={this.handleRemoveDiscoveryCollectionshChange}
              />
            </div>
          </div>
        </div>
        <div className="text-grey-darker mt-2">
          {client.description}
        </div>
        {client.collections && client.collections.length > 0 && (
          <div className="my-4">
            <div className="text-grey-darker">Collections</div>

            {client.collections.map(
              collection => (
                <CollectionListItem
                  key={collection.id}
                  collection={collection}
                  client={client}
                />
              ),
            )}
          </div>
        )}
      </li>
    );
  }
}
