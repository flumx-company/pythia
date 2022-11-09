import { withFilter } from 'apollo-server-koa';
import { pubsub } from '@/server/api/utils';
import { IMPORT_ZENDESK_DATA_TYPE } from '@/jobs/importZendeskData/utils';

export default {
  subscribe: withFilter(
    () => pubsub.asyncIterator(IMPORT_ZENDESK_DATA_TYPE),
    (payload, args) => args.clientId === payload[IMPORT_ZENDESK_DATA_TYPE].id,
  ),
};
