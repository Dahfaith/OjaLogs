import { Product } from '@ojalogs/shared';

export interface ProvisionResult {
  secretKey: string;
  deliveryFormat: string;
  instructions: string;
  externalTransactionId: string;
}

export interface IServerApiAdapter {
  readonly serverCluster: 'Server 1' | 'Server 2' | 'Server 3' | 'Server 4';
  readonly name: string;
  checkHealth(): Promise<{ healthy: boolean; latencyMs: number }>;
  fetchCatalog(): Promise<Product[]>;
  checkStock(sku: string): Promise<number>;
  provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult>;
}

