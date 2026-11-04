import { IServerApiAdapter, ProvisionResult } from './server.interface.js';
import { Product } from '@ojalogs/shared';

export class Server2ApiAdapter implements IServerApiAdapter {
  readonly serverCluster = 'Server 2';
  readonly name = 'Server 2 API (Social Media Accounts & Cloud Infrastructure)';

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 78 };
  }

  async fetchCatalog(): Promise<Product[]> {
    return [];
  }

  async checkStock(sku: string): Promise<number> {
    return 120;
  }

  async provisionSecret(sku: string, orderRef: string, metadata?: any): Promise<ProvisionResult> {
    const isFacebook = sku.toLowerCase().includes('facebook');
    const isTwitter = sku.toLowerCase().includes('twitter') || sku.toLowerCase().includes('x-');
    const isCloud = sku.toLowerCase().includes('aws') || sku.toLowerCase().includes('digitalocean');

    if (isFacebook) {
      return {
        secretKey: `https://business.facebook.com/invitation/claim?token=fb_bm50_${Math.random().toString(36).substring(2, 16)}`,
        deliveryFormat: 'Secure Agency Administrator Invitation Link',
        instructions: 'Open link in an incognito window with your Facebook profile logged in to accept admin ownership.',
        externalTransactionId: `srv2_fb_${Date.now()}`
      };
    }

    if (isTwitter) {
      const username = `oj_creator_${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        secretKey: `${username}:Pass${Math.random().toString(36).substring(2, 8)}!:${username}@mailsec.org:2FA_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        deliveryFormat: 'Username:Password:Email:2FA_Secret',
        instructions: 'Log in using the provided 2FA key in Google Authenticator or 2fa.live.',
        externalTransactionId: `srv2_tw_${Date.now()}`
      };
    }

    if (isCloud) {
      return {
        secretKey: `AWS-PROMO-CREDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        deliveryFormat: 'Cloud Promotional Voucher Token',
        instructions: 'Billing > Credits > Redeem promotional credit code.',
        externalTransactionId: `srv2_cloud_${Date.now()}`
      };
    }

    // Default Instagram Aged Account
    const igUser = `insta_user_${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      secretKey: `${igUser}:IGPass${Math.random().toString(36).substring(2, 8)}!:${igUser}@secmail.net:2FA_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      deliveryFormat: 'Username:Password:Email:2FA_Secret',
      instructions: 'Aged profile credentials with 2FA secret. Log in and configure your verified recovery email.',
      externalTransactionId: `srv2_ig_${Date.now()}`
    };
  }
}

