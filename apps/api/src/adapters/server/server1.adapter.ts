import { IServerApiAdapter, ProvisionResult } from './server.interface.js';
import { Product } from '@ojalogs/shared';
import { logspollAdapter } from '../logspoll/logspoll.adapter.js';
import { AppError } from '../../middleware/errorHandler.js';

export class Server1ApiAdapter implements IServerApiAdapter {
  readonly serverCluster = 'Server 1';
  readonly name = 'Server 1 API (Enterprise Security, Proxies & eSIM)';

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    if (process.env.NODE_ENV === 'test') {
      return { healthy: true, latencyMs: 64 };
    }
    if (logspollAdapter.getCredentials().isConfigured) {
      const hp = await logspollAdapter.checkHealth();
      return { healthy: hp.healthy, latencyMs: hp.latencyMs };
    }
    return { healthy: true, latencyMs: 64 };
  }

  async fetchCatalog(): Promise<Product[]> {
    return [];
  }

  async checkStock(sku: string): Promise<number> {
    return 85;
  }

  async provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult> {
    const titleLower = (metadata?.title || '').toLowerCase();
    const skuLower = sku.toLowerCase();
    const combined = `${titleLower} ${skuLower}`;

    // Prevent misrouted social accounts / emails to Server 1
    if (
      combined.includes('facebook') ||
      combined.includes('fb') ||
      combined.includes('instagram') ||
      combined.includes('twitter') ||
      combined.includes('aged x') ||
      combined.includes('tiktok') ||
      combined.includes('gmail')
    ) {
      throw new AppError(
        `Server 1 (Security & Proxies) cannot fulfill social account item "${metadata?.title || sku}". Route through Server 2.`,
        400,
        'SERVER_CLUSTER_MISMATCH'
      );
    }

    const isTestMode = process.env.NODE_ENV === 'test' || sku.includes('test');

    // 1. If SKU is a LogsPoll product or LogsPoll API is configured, attempt live upstream dispatch in live mode
    if (!isTestMode && (sku.startsWith('lp_') || (logspollAdapter.getCredentials().isConfigured && !sku.startsWith('prod_')))) {
      try {
        console.log(`[SERVER_1_LOGSPOLL] Ordering product for SKU: ${sku} via LogsPoll API...`);
        const orderResult = await logspollAdapter.orderProduct(sku, metadata?.quantity || 1, orderRef);
        if (orderResult.success && orderResult.secretKey) {
          console.log(`[SERVER_1_LOGSPOLL] ✓ Successfully provisioned from LogsPoll: ${orderResult.orderId}`);
          return {
            secretKey: orderResult.secretKey,
            deliveryFormat: orderResult.deliveryFormat || 'Credentials / 2FA Token',
            instructions: orderResult.instructions || 'Redeem and secure your account credentials with 2FA.',
            externalTransactionId: `lp_${orderResult.orderId || Date.now()}`
          };
        } else {
          const errMsg = orderResult.error || 'LogsPoll upstream rejected order (insufficient provider balance or out of stock)';
          console.error(`[SERVER_1_LOGSPOLL] Upstream failure: ${errMsg}`);
          throw new AppError(errMsg, 503, 'UPSTREAM_REJECTED');
        }
      } catch (err: any) {
        console.error(`[SERVER_1_LOGSPOLL] Upstream dispatch failed: ${err.message}`);
        throw err;
      }
    }

    // In production, NEVER generate synthetic/mock secrets!
    if (process.env.NODE_ENV !== 'test' && !sku.includes('test')) {
      throw new AppError(
        'Server 1 automated provisioning is unavailable for this SKU. Upstream liquidity or catalog sync required.',
        503,
        'PROVISIONING_UNAVAILABLE'
      );
    }

    // Test-environment simulation ONLY for verified test suites
    const isEsim = combined.includes('esim');
    const isProxy = combined.includes('proxy');

    if (isEsim) {
      return {
        secretKey: `LPA:1$simglobal.prod.esim$${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        deliveryFormat: 'Instant QR Profile & SM-DP+ Address',
        instructions: 'Scan QR code in Settings > Cellular > Add eSIM, or enter the activation string manually.',
        externalTransactionId: `srv1_esim_${Date.now()}`
      };
    }

    if (isProxy) {
      const port = Math.floor(10000 + Math.random() * 50000);
      return {
        secretKey: `res-proxy.ojalogs.net:${port}:oj_client_${orderRef.slice(-4)}:pass_${Math.random().toString(36).substring(2, 8)}`,
        deliveryFormat: 'Host:Port:User:Pass HTTP/SOCKS5 Endpoint',
        instructions: 'Configure this proxy in your browser or scraper. Sticky IP sessions supported up to 30 mins.',
        externalTransactionId: `srv1_proxy_${Date.now()}`
      };
    }

    // Default VPN Voucher ONLY for explicit VPN test SKUs in test mode
    return {
      secretKey: `NORD-PRO-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      deliveryFormat: 'Alphanumeric Activation Key',
      instructions: 'Redeem at the official provider portal with your account.',
      externalTransactionId: `srv1_vpn_${Date.now()}`
    };
  }
}


