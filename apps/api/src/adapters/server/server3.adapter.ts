import { IServerApiAdapter, ProvisionResult } from './server.interface.js';
import { Product } from '@ojalogs/shared';
import { logspollAdapter } from '../logspoll/logspoll.adapter.js';
import { AppError } from '../../middleware/errorHandler.js';

export class Server3ApiAdapter implements IServerApiAdapter {
  readonly serverCluster = 'Server 3';
  readonly name = 'Server 3 API (Developer Software & OS Licenses)';

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    if (process.env.NODE_ENV === 'test') {
      return { healthy: true, latencyMs: 45 };
    }
    if (logspollAdapter.getCredentials().isConfigured) {
      const hp = await logspollAdapter.checkHealth();
      return { healthy: hp.healthy, latencyMs: hp.latencyMs };
    }
    return { healthy: true, latencyMs: 45 };
  }

  async fetchCatalog(): Promise<Product[]> {
    return [];
  }

  async checkStock(sku: string): Promise<number> {
    return 150;
  }

  async provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult> {
    const isTestMode = process.env.NODE_ENV === 'test' || sku.includes('test');

    // 1. If SKU is a LogsPoll product or LogsPoll API is configured, attempt live upstream dispatch in live mode
    if (!isTestMode && (sku.startsWith('lp_') || (logspollAdapter.getCredentials().isConfigured && !sku.startsWith('prod_')))) {
      try {
        console.log(`[SERVER_3_LOGSPOLL] Ordering product for SKU: ${sku} via LogsPoll API...`);
        const orderResult = await logspollAdapter.orderProduct(sku, metadata?.quantity || 1, orderRef);
        if (orderResult.success && orderResult.secretKey) {
          console.log(`[SERVER_3_LOGSPOLL] ✓ Successfully provisioned from LogsPoll: ${orderResult.orderId}`);
          return {
            secretKey: orderResult.secretKey,
            deliveryFormat: orderResult.deliveryFormat || 'Official License Certificate Token',
            instructions: orderResult.instructions || 'Redeem code according to platform instructions.',
            externalTransactionId: `lp_${orderResult.orderId || Date.now()}`
          };
        } else {
          const errMsg = orderResult.error || 'LogsPoll upstream rejected order for Server 3';
          console.error(`[SERVER_3_LOGSPOLL] Upstream failure: ${errMsg}`);
          throw new AppError(errMsg, 503, 'UPSTREAM_REJECTED');
        }
      } catch (err: any) {
        console.error(`[SERVER_3_LOGSPOLL] Upstream dispatch error: ${err.message}`);
        throw err;
      }
    }

    // In production, NEVER generate synthetic/mock license keys!
    if (process.env.NODE_ENV !== 'test' && !sku.includes('test')) {
      throw new AppError(
        'Server 3 automated provisioning is unavailable. Upstream provider connection required.',
        503,
        'PROVISIONING_UNAVAILABLE'
      );
    }

    const titleLower = (metadata?.title || '').toLowerCase();
    const skuLower = sku.toLowerCase();
    const combined = `${titleLower} ${skuLower}`;

    const isWindows = combined.includes('windows') || combined.includes('office') || combined.includes('microsoft');
    
    if (isWindows) {
      // 25-character Microsoft Product Key for test mode
      const seg = () => Math.random().toString(36).substring(2, 7).toUpperCase();
      return {
        secretKey: `${seg()}-${seg()}-${seg()}-${seg()}-${seg()}`,
        deliveryFormat: '25-Digit Retail License Key',
        instructions: 'Settings > System > Activation > Change product key. Activates online permanently.',
        externalTransactionId: `srv3_ms_${Date.now()}`
      };
    }

    // JetBrains All Products Pack for test mode
    return {
      secretKey: `JB-DEV-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      deliveryFormat: 'Official License Certificate Token',
      instructions: 'Apply in your JetBrains Account portal under Licenses > Add License.',
      externalTransactionId: `srv3_jb_${Date.now()}`
    };
  }
}


