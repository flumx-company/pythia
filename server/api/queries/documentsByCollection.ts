import { DiscoveryDocument } from '@/db/models';

interface DocumentQueryParams {
  discoveryCollectionId: string;
}

export default async (parent: any, { discoveryCollectionId }: DocumentQueryParams) => {
  return DiscoveryDocument.findAll({
    where: {
      discoveryCollectionId,
    },
  });
};
