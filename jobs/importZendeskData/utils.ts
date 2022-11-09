import {
  updateJobStatus,
  setJobStatus,
  addJobErrorStatus,
} from '@/jobs/utils';

export const IMPORT_ZENDESK_DATA_TYPE = 'zendeskDataImportStatus';

interface UpdateImportStatusOptions {
  [key: string]: any;
}

export const updateImportStatus = async (
  label: string,
  clientId: string,
  options: UpdateImportStatusOptions = {},
) =>
  updateJobStatus(label, {
    id: clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  }, options);

export const setInitialImportStatus = async (id: string): Promise<null> =>
  setJobStatus({
    steps: [],
    error: null,
    started: false,
    ended: false,
    offed: true,
  }, {
    id,
    type: IMPORT_ZENDESK_DATA_TYPE,
  });

export const startImport = async (clientId: string): Promise<void> => {
  await updateJobStatus('Import started', {
    id: clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  }),

  await setJobStatus({
    started: true,
    offed: false,
  }, {
    id: clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  });
};

interface StopImportParams {
  clientId: string;
  err: Error;
}

export const stopImport = async ({
  clientId,
  err,
}: StopImportParams) => {
  updateJobStatus(err.message, {
    id: clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  });

  return addJobErrorStatus(err, {
    id: clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  });
};

export const finishImport = async (clientId: string) => {
  await Promise.all([
    updateJobStatus('Import finished', {
      id: clientId,
      type: IMPORT_ZENDESK_DATA_TYPE,
    }, {
      labelType: 'success',
    }),
  ]);

  return setJobStatus({
    ended: true,
  }, {
    id: clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  });
};
