import { setInitialTrainingCollectionStatus } from '@/jobs/trainCollection/utils';

export default async (root: any, { id }: any) => {
  return setInitialTrainingCollectionStatus(id);
};
