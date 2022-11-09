import discovery from '@/providers/watson/discovery';

export default async () => discovery.collections.list();
