import { Client } from '@/db/models';
import { toPlain } from '@/helpers/database';

import importZendeskData, {
  ZendeskDataImportParams,
} from '@/jobs/importZendeskData/importZendeskData';
import {
  setInitialImportStatus,
  stopImport,
  startImport,
  finishImport,
} from '@/jobs/importZendeskData/utils';

const handleZendeskDataImport = async (zendeskDataImportParams: ZendeskDataImportParams) => {
  const { clientId } = zendeskDataImportParams;

  await setInitialImportStatus(clientId);
  await startImport(clientId);

  try {
    await importZendeskData(zendeskDataImportParams);
  } catch (err) {
    return stopImport({
      clientId,
      err,
    });
  }

  await finishImport(clientId);
};

export default async (root: any, { id }: any): Promise<boolean> => {
  const client = toPlain(await Client.findOne({
    where: {
      id,
    },
  }));

  if (!client) {
    return false;
  }

  const {
    id: clientId,
    zendeskUsername,
    zendeskApiToken,
    zendeskChatApiToken,
    zendeskDomain,
  } = client;

  const zendeskDataImportParams = {
    clientId,
    zendeskUsername,
    zendeskApiToken,
    zendeskChatApiToken,
    zendeskDomain,
  };

  // doesn't need to be awaited to prevent long request server error
  handleZendeskDataImport(zendeskDataImportParams);

  return true;
};
