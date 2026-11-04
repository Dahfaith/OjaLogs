import { IServerApiAdapter, ProvisionResult } from './server.interface.js';
import { Product } from '@ojalogs/shared';

export class Server1ApiAdapter implements IServerApiAdapter {
  readonly serverCluster = 'Server 1';
  readonly name = 'Server 1 API (Enterprise Security, Proxies & eSIM)';

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 64 };
  }

  async fetchCatalog(): Promise<Product[]> {
    return [];
  }

  async checkStock(sku: string): Promise<number> {
    return 85;
  }

  async provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult> {
    const isEsim = sku.toLowerCase().includes('esim');
    const isProxy = sku.toLowerCase().includes('proxy');

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

    // Default VPN Voucher
    return {
      secretKey: `NORD-PRO-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      deliveryFormat: 'Alphanumeric Activation Key',
      instructions: 'Redeem at the official provider portal with your account.',
      externalTransactionId: `srv1_vpn_${Date.now()}`
    };
  }
}

