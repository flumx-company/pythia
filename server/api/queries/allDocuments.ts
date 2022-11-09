import { DiscoveryDocument } from '@/db/models';

export default async () => DiscoveryDocument.findAll();
