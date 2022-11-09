export default interface DiscoveryCollection {
  id: string;
  name: string;
  description: string;
  discoveryId: string;
  nluModelId: string;
  isDefault: boolean;
  isBeingTrained: boolean;
  lastTrainedAt: string;
  type: string;
}
