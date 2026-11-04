import { IServerApiAdapter, ProvisionResult } from './server.interface.js';
import { Product } from '@ojalogs/shared';

export class Server3ApiAdapter implements IServerApiAdapter {
  readonly serverCluster = 'Server 3';
  readonly name = 'Server 3 API (Developer Software & OS Licenses)';

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 45 };
  }

  async fetchCatalog(): Promise<Product[]> {
    return [];
  }

  async checkStock(sku: string): Promise<number> {
    return 150;
  }

  async provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult> {
    const isWindows = sku.toLowerCase().includes('windows');
    
    if (isWindows) {
      // 25-character Microsoft Product Key
      const seg = () => Math.random().toString(36).substring(2, 7).toUpperCase();
      return {
        secretKey: `${seg()}-${seg()}-${seg()}-${seg()}-${seg()}`,
        deliveryFormat: '25-Digit Retail License Key',
        instructions: 'Settings > System > Activation > Change product key. Activates online permanently.',
        externalTransactionId: `srv3_ms_${Date.now()}`
      };
    }

    // JetBrains All Products Pack
    return {
      secretKey: `JB-DEV-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      deliveryFormat: 'Official License Certificate Token',
      instructions: 'Apply in your JetBrains Account portal under Licenses > Add License.',
      externalTransactionId: `srv3_jb_${Date.now()}`
    };
  }
}

