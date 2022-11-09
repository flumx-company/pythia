import { Client, DiscoveryCollection, DiscoveryDocument } from '@/db/models';

interface ClientQueryParams {
  id: string;
}

export default async (parent: any, { id }: ClientQueryParams) =>
  Client.findOne({
    where: {
      id,
    },
    include: [
      {
        model: DiscoveryCollection,
        as: 'collections',
        include: [
          {
            model: DiscoveryDocument,
            as: 'documents',
          },
        ],
      },
    ],
    order: [
      [
        { model: DiscoveryCollection, as: 'collections' },
        { model: DiscoveryDocument, as: 'documents' },
        'createdAt',
        'ASC',
      ],
    ],
  });
