import { setInitialImportStatus } from '@/jobs/importZendeskData/utils';

export default async (root: any, { id }: any) => {
  return setInitialImportStatus(id);
};
