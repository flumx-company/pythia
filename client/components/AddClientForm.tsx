import React, { SFC } from 'react';
import { Mutation } from 'react-apollo';
import { Formik } from 'formik';
import addClientMutation from '@/mutations/addClient';
import Button from '@/components/Button';
import { getClientsQuery } from '@/views/Clients';
import Checkbox from '@/components/Checkbox';
import FormField from '@/components/FormField';
import { showError } from '@/services/notifications';

interface AddClientFormProps {
  onCancel?: any;
  onAdded?: any;
}

const handleFormValidate = () => ({});
const handleFormSubmit = () => {};
const handleInnerFormSubmit = ({
  values,
  handleSubmit,
  addClient,
}: any) => (event: any) => {
  event.preventDefault();
  let variables;

  if (values.json) {
    try {
      variables = JSON.parse(values.json);
    } catch (err) {
      return showError(`Invalid JSON: ${err.message}`);
    }
  } else {
    variables = values;
  }

  addClient({ variables });
  return handleSubmit(event);
};

const handleAddClientComplete = (onAdded: any) => (data: any) => onAdded(data.addClient);

const handleCreateDiscoveryCollectionChange = (setFieldValue: any) => (event: any) => {
  setFieldValue('discoveryCollectionId', '');
  setFieldValue('createDiscoveryCollection', event.currentTarget.checked);
};

const handleCreateShortcutsDiscoveryCollection = (setFieldValue: any) => (event: any) => {
  setFieldValue('shortcutsDiscoveryCollectionId', '');
  setFieldValue('createShortcutsDiscoveryCollection', event.currentTarget.checked);
};

const renderAddClientForm = ({
  onCancel,
  onAdded,
}: AddClientFormProps) => ({
  values,
  handleChange,
  handleSubmit,
  setFieldValue,
}: any) => (
  <Mutation
    mutation={addClientMutation}
    onCompleted={handleAddClientComplete(onAdded)}
    refetchQueries={[{ query: getClientsQuery }]}
  >
    {(addClient, { loading, error }) => (
      <form
        className="max-w-md m-auto"
        onSubmit={handleInnerFormSubmit({
          values,
          handleSubmit,
          addClient,
        })}
      >
        <FormField
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          required={true}
        />

        <FormField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
        />

        <FormField
          label="Discovery Username"
          name="discoveryUsername"
          value={values.discoveryUsername}
          onChange={handleChange}
        />

        <FormField
          label="Discovery Password"
          name="discoveryPassword"
          value={values.discoveryPassword}
          onChange={handleChange}
        />

        <FormField
          label="Discovery API Key *"
          name="discoveryApiKey"
          value={values.discoveryApiKey}
          onChange={handleChange}
        />

        <FormField
          label="Discovery Url"
          name="discoveryUrl"
          value={values.discoveryUrl}
          onChange={handleChange}
          required={true}
        />

        <FormField
          label="Discovery Environment Id"
          name="discoveryEnvironmentId"
          value={values.discoveryEnvironmentId}
          onChange={handleChange}
          required={true}
        />

        <FormField
          label="Discovery Configuration Id"
          name="discoveryConfigurationId"
          value={values.discoveryConfigurationId}
          onChange={handleChange}
          required={true}
        />

        <div className="my-8 flex items-center">
          <label className="text-xs font-bold text-grey-darker">Create New Discovery Collection (Macros)</label>
          <div className="flex flex-no-shrink ml-4">
            <Checkbox
              name="createDiscoveryCollection"
              checked={values.createDiscoveryCollection}
              onChange={handleCreateDiscoveryCollectionChange(setFieldValue)}
            />
          </div>
        </div>

        {!values.createDiscoveryCollection && (
          <FormField
            label="Discovery Collection Id (Macros)"
            name="discoveryCollectionId"
            value={values.discoveryCollectionId}
            onChange={handleChange}
            tip="Leave this field empty if you do not want to create Discovery Collection for macros"
          />
        )}

        <div className="my-8 flex items-center">
          <label className="text-xs font-bold text-grey-darker">Create New Discovery Collection (Shortcuts)</label>
          <div className="flex flex-no-shrink ml-4">
            <Checkbox
              name="createShortcutsDiscoveryCollection"
              checked={values.createShortcutsDiscoveryCollection}
              onChange={handleCreateShortcutsDiscoveryCollection(setFieldValue)}
            />
          </div>
        </div>

        {!values.createShortcutsDiscoveryCollection && (
          <FormField
            label="Discovery Collection Id (Shortcuts)"
            name="shortcutsDiscoveryCollectionId"
            value={values.shortcutsDiscoveryCollectionId}
            onChange={handleChange}
            tip="Leave this field empty if you do not want to create Discovery Collection for shortcuts"
          />
        )}

        <FormField
          label="NLU Username"
          name="nluUsername"
          value={values.nluUsername}
          onChange={handleChange}
        />

        <FormField
          label="NLU Password"
          name="nluPassword"
          value={values.nluPassword}
          onChange={handleChange}
        />

        <FormField
          label="NLU API Key"
          name="nluApiKey"
          value={values.nluApiKey}
          onChange={handleChange}
        />

        <FormField
          label="NLU Model Id"
          name="nluModelId"
          value={values.nluModelId}
          onChange={handleChange}
        />

        <FormField
          label="Zendesk Domain"
          name="zendeskDomain"
          value={values.zendeskDomain}
          onChange={handleChange}
          required={true}
        />

        <FormField
          label="Zendesk Username"
          name="zendeskUsername"
          value={values.zendeskUsername}
          onChange={handleChange}
          required={true}
        />

        <FormField
          label="Zendesk API Token"
          name="zendeskApiToken"
          value={values.zendeskApiToken}
          onChange={handleChange}
          required={true}
        />

        <FormField
          label="Zendesk Chat Password"
          name="zendeskChatPassword"
          value={values.zendeskChatPassword}
          onChange={handleChange}
        />

        <FormField
          label="Zendesk Chat API Token"
          name="zendeskChatApiToken"
          value={values.zendeskChatApiToken}
          onChange={handleChange}
        />

        <div className="my-2">
          <label className="text-xs font-bold text-grey-darker">Or insert data as JSON</label>
          <div>
            <textarea
              className="border-b block w-full py-2 px-3"
              name="json"
              value={values.json}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-8 text-right">
          <Button type="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            submit={true}
          >
            {
              loading ? 'Loading' : 'Add Client'
            }
          </Button>
        </div>
      </form>
    )}
  </Mutation>
);

const AddClientForm: SFC<AddClientFormProps> = ({
  onCancel,
  onAdded,
}) => (
  <Formik
    initialValues={{
      name: '',
      description: '',
      discoveryUsername: '',
      discoveryPassword: '',
      discoveryApiKey: '',
      discoveryUrl: '',
      discoveryEnvironmentId: '',
      discoveryConfigurationId: '',
      createDiscoveryCollection: true,
      discoveryCollectionId: '',
      createShortcutsDiscoveryCollection: true,
      shortcutsDiscoveryCollectionId: '',
      nluUsername: '',
      nluPassword: '',
      nluApiKey: '',
      nluModelId: '',
      zendeskDomain: '',
      zendeskUsername: '',
      zendeskApiToken: '',
      zendeskChatApiToken: '',
      zendeskChatPassword: '',
      json: '',
    }}
    validate={handleFormValidate}
    onSubmit={handleFormSubmit}
    render={renderAddClientForm({ onAdded, onCancel })}
  />
);

export default AddClientForm;
