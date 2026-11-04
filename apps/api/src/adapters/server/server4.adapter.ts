import { IServerApiAdapter, ProvisionResult } from './server.interface.js';
import { Product } from '@ojalogs/shared';

export class Server4ApiAdapter implements IServerApiAdapter {
  readonly serverCluster = 'Server 4';
  readonly name = 'Server 4 API (AI Tools & Model Access)';

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 50 };
  }

  async fetchCatalog(): Promise<Product[]> {
    return [];
  }

  async checkStock(sku: string): Promise<number> {
    return 65;
  }

  async provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult> {
    const isClaude = sku.toLowerCase().includes('claude');
    const isMidjourney = sku.toLowerCase().includes('midjourney');

    if (isClaude) {
      return {
        secretKey: `CLAUDE-PRO-PASS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        deliveryFormat: 'Prepaid Digital Voucher Token',
        instructions: 'Redeem on claude.ai/settings/billing under Gift/Promo Code.',
        externalTransactionId: `srv4_claude_${Date.now()}`
      };
    }

    if (isMidjourney) {
      return {
        secretKey: `MJ-STD-SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        deliveryFormat: 'Discord Subscription Key',
        instructions: 'Apply on midjourney.com/account with your Discord account.',
        externalTransactionId: `srv4_mj_${Date.now()}`
      };
    }

    // Default ChatGPT Plus
    return {
      secretKey: `OAI-GPT4O-PLUS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      deliveryFormat: 'Official 30-Day Subscription Voucher',
      instructions: 'Redeem directly on chatgpt.com under Upgrade to Plus > Redeem Code.',
      externalTransactionId: `srv4_oai_${Date.now()}`
    };
  }
}

