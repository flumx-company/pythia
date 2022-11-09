import { IMPORT_ZENDESK_DATA_TYPE } from '@/jobs/importZendeskData/utils';
import { getJobStatus } from '@/jobs/utils';

export default async (root: any, args: any) => {
  return getJobStatus({
    id: args.clientId,
    type: IMPORT_ZENDESK_DATA_TYPE,
  });
};
