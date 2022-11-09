import { withFilter } from 'apollo-server-koa';
import { pubsub } from '@/server/api/utils';
import { COLLECTION_TRAINING_TYPE } from '@/jobs/trainCollection/utils';

export default {
  subscribe: withFilter(
    () => pubsub.asyncIterator(COLLECTION_TRAINING_TYPE),
    (payload, args) => args.collectionId === payload[COLLECTION_TRAINING_TYPE].id,
  ),
};
