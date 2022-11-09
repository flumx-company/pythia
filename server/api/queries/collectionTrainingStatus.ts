import { COLLECTION_TRAINING_TYPE } from '@/jobs/trainCollection/utils';
import { getJobStatus } from '@/jobs/utils';

export default async (root: any, args: any) => {
  return getJobStatus({
    id: args.collectionId,
    type: COLLECTION_TRAINING_TYPE,
  });
};
