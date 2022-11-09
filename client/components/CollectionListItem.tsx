import React from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { Link } from 'react-router-dom';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Collection from '@/types/collection';
import Client from '@/types/client';
import Label from '@/components/Label';
import JobStatusStep from '@/components/JobStatusStep';

interface CollectionListItemState {
  isBeingTrained: boolean;
  skipTraining: boolean;
  useTranslit: boolean;
  trainingStatus?: string | null;
}

interface CollectionListItemProps {
  collection: Collection;
  client: Client;
}

const trainCollectionMutation = gql`
  mutation TrainCollectionMutation(
    $id: String,
    $skipTraining: Boolean,
    $useTranslit: Boolean,
  ) {
    trainCollection(
      id: $id,
      skipTraining: $skipTraining,
      useTranslit: $useTranslit,
    )
  }
`;

// const stopCollectionTrainingMutation = gql`
//   mutation StopCollectionTrainingMutation($id: String) {
//     stopCollectionTraining(id: $id)
//   }
// `;

const resetCollectionTrainingMutation = gql`
  mutation ResetCollectionTrainingMutation(
    $id: String,
  ) {
    resetCollectionTraining(
      id: $id,
    )
  }
`;

const collectionTrainingStatusQuery = gql`
  query CollectionTrainingStatus(
    $collectionId: String,
  ) {
    collectionTrainingStatus(
      collectionId: $collectionId,
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

const collectionTrainingStatusSubscription = gql`
  subscription CollectionTrainingStatus(
    $collectionId: String,
  ) {
    collectionTrainingStatus(
      collectionId: $collectionId,
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

interface CollectionListItemHeaderTrainingProps {
  collection: Collection;
  client: Client;
  trainingCompleted: boolean;
  trainingHasErrors: boolean;
  onProceedButtonClick(resetCollectionTrainingCallback: () => any): any;
}

const CollectionListItemHeaderTraining = ({
  collection,
  client,
  trainingCompleted,
  onProceedButtonClick,
  trainingHasErrors,
}: CollectionListItemHeaderTrainingProps) => {
  const handleProceedButtonClick = (
    onProceedButtonClickFn: (resetCollectionTrainingFn: any) => any,
    resetCollectionTrainingFn: () => any,
  ) => () => {
    onProceedButtonClickFn(resetCollectionTrainingFn);
  };

  let labelType;
  let labelText = 'Training in progress';

  if (trainingHasErrors) {
    labelType = 'error';
    labelText = 'Training errored';
  } else if (trainingCompleted) {
    labelType = 'success';
    labelText = 'Training succeeded';
  }

  const collectionTrainingUrl = `/clients/${client.id}/collections/${collection.id}/training`;

  return (
    <div className="flex items-center">
      <div className="flex mr-2">
        <Link to={collectionTrainingUrl} className="pt-link text-sm">Training Details</Link>
      </div>

      <div className="flex mr-2">
        <Label
          text={labelText}
          type={labelType as any}
        />
      </div>

      {(trainingCompleted || trainingHasErrors) && (
        <Mutation
          mutation={resetCollectionTrainingMutation}
          variables={{
            id: collection.id,
          }}
        >
          {resetCollectionTraining => (
            <Button
              size="xs"
              type="primary"
              onClick={handleProceedButtonClick(onProceedButtonClick, resetCollectionTraining)}
            >
              Proceed
            </Button>
          )}
        </Mutation>
      )}
    </div>
  );
};

interface CollectionListItemHeaderNotTrainedProps {
  collection: Collection;
  skipTraining: boolean;
  useTranslit: boolean;
  onSkipTrainingChange(checked: boolean): void;
  onUseTranslitChange(checked: boolean): void;
  onTrainButtonClick(trainCollection: () => any): void;
}

const CollectionListItemHeaderNotTrained = ({
  collection,
  skipTraining,
  useTranslit,
  onSkipTrainingChange,
  onUseTranslitChange,
  onTrainButtonClick,
}: CollectionListItemHeaderNotTrainedProps) => {
  const handleSkipTrainingChange = (onSkipTrainingChangeFn: (checked?: boolean) => any) => (event: any) => {
    onSkipTrainingChangeFn(event.currentTarget.checked);
  };

  const handleUseTranslitChange = (onUseTranslitChangeFn: (checked?: boolean) => any) => (event: any) => {
    onUseTranslitChangeFn(event.currentTarget.checked);
  };

  const handleTrainButtonClick = (trainCollectionFn: () => any) => (event: any) => {
    onTrainButtonClick(trainCollectionFn);
  };

  return (
    <div className="flex items-center">
      <div className="mr-4">
        <Checkbox
          checked={skipTraining}
          onChange={handleSkipTrainingChange(onSkipTrainingChange)}
          label="Skip Training"
        />
      </div>

      <div className="mr-4">
        <label className="flex items-center">
          <Checkbox
            checked={useTranslit}
            onChange={handleUseTranslitChange(onUseTranslitChange)}
            label="Use Translit"
          />
        </label>
      </div>

      <Mutation
        mutation={trainCollectionMutation}
        variables={{
          skipTraining,
          useTranslit,
          id: collection.id,
        }}
      >
        {trainCollection => (
          <Button
            type="primary"
            size="xs"
            onClick={handleTrainButtonClick(trainCollection)}
          >
            Train
          </Button>
        )}
      </Mutation>
    </div>
  );
};

export default class CollectionListItem extends React.Component<CollectionListItemProps, CollectionListItemState> {
  readonly state: CollectionListItemState = {
    isBeingTrained: false,
    skipTraining: true,
    useTranslit: false,
  };

  async handleCollectionStopTrainingButtonClick(stopCollectionTraining: Function) {
    return window.alert('Stopping is not working yet, sorry. :(');
  }

  handleCollectionTrainButtonClick = async (trainCollection: Function) => {
    this.setState({
      isBeingTrained: true,
      trainingStatus: null,
    });

    await trainCollection();
  }

  handleSkipTrainingChange = (checked: boolean) => {
    this.setState({
      skipTraining: checked,
    });
  }

  handleUseTranslitChange = (checked: boolean) => {
    this.setState({
      useTranslit: checked,
    });
  }

  handleProceedButtonClick = (resetCollectionTraining: () => any) => {
    this.setState({
      isBeingTrained: false,
    });

    resetCollectionTraining();
  }

  subscribeToTrainingStatus = (subscribeToMore: (arg: any) => any, variables: any) => {
    return subscribeToMore({
      variables,
      document: collectionTrainingStatusSubscription,
      updateQuery: (prev: any, { subscriptionData: { data } }: any) => {
        if (!data) {
          return prev;
        }

        return data;
      },
    });
  }

  render() {
    const { collection, client } = this.props;
    const collectionId = collection.id;

    return (
      <Query
        query={collectionTrainingStatusQuery}
        variables={{ collectionId }}
      >
        {
          ({ data, subscribeToMore }) => {
            this.subscribeToTrainingStatus(subscribeToMore, { collectionId });

            if (!data || !data.collectionTrainingStatus) {
              return (
                <div>Loading...</div>
              );
            }

            const { collectionTrainingStatus } = data;

            const trainingCompleted = collectionTrainingStatus.ended && !collectionTrainingStatus.error;
            const trainingHasErrors = collectionTrainingStatus.error;

            const collectionDetailsUrl = `/clients/${client.id}/collections/${collection.id}`;

            return (
              <div className="mt-2 bg-grey-lighter p-3">
                <div className="flex items-center">
                  <div className="font-semibold text-grey-darkest flex-grow">
                    <Link to={collectionDetailsUrl} className="pt-link font-semibold">{collection.name}</Link>
                  </div>

                  <div className="ml-4">
                    {
                      collectionTrainingStatus.started
                        ? (
                          <CollectionListItemHeaderTraining
                            collection={collection}
                            client={client}
                            trainingCompleted={trainingCompleted}
                            onProceedButtonClick={this.handleProceedButtonClick}
                            trainingHasErrors={trainingHasErrors}
                          />
                        ) : (
                          <CollectionListItemHeaderNotTrained
                            collection={collection}
                            skipTraining={this.state.skipTraining}
                            useTranslit={this.state.useTranslit}
                            onSkipTrainingChange={this.handleSkipTrainingChange}
                            onUseTranslitChange={this.handleUseTranslitChange}
                            onTrainButtonClick={this.handleCollectionTrainButtonClick}
                          />
                        )
                    }
                  </div>
                </div>

                {collectionTrainingStatus.started && (
                  <div>
                    {collectionTrainingStatus.steps && collectionTrainingStatus.steps.map((step: any, index: number) => {
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
          // tslint:disable-next-line
        }
      </Query>
    );
  }
}
