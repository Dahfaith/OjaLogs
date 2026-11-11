import { env } from '../../config/env.js';

export interface LogsPollProduct {
  id: string;
  title: string;
  category: string;
  priceNgn: number;
  stockCount: number;
  deliveryFormat?: string;
  description?: string;
}

export interface LogsPollOrderResult {
  success: boolean;
  orderId?: string;
  reference?: string;
  status: string;
  secretKey?: string;
  deliveryFormat?: string;
  instructions?: string;
  error?: string;
}

export class LogsPollAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = (apiKey || process.env.LOGSPOLL_API_KEY || env.LOGSPOLL_API_KEY || '').trim();
    this.baseUrl = (baseUrl || process.env.LOGSPOLL_BASE_URL || env.LOGSPOLL_BASE_URL || 'https://logspoll.com/api/v1').replace(/\/+$/, '');
  }

  setCredentials(apiKey: string, baseUrl?: string) {
    this.apiKey = (apiKey || '').trim();
    if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/+$/, '');
    }
  }

  getCredentials() {
    return {
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      isConfigured: Boolean(this.apiKey && this.apiKey.length > 5)
    };
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    const startTime = Date.now();
    try {
      const resp = await fetch(`${this.baseUrl}/products?availability=in-stock&limit=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        }
      });

      const latencyMs = Date.now() - startTime;
      if (resp.ok) {
        return {
          healthy: true,
          latencyMs,
          message: `Live connection verified with LogsPoll API (HTTP ${resp.status}).`
        };
      }
      return {
        healthy: false,
        latencyMs,
        message: `LogsPoll returned HTTP ${resp.status}`
      };
    } catch (err: any) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: `LogsPoll connection error: ${err.message}`
      };
    }
  }

  async getBalance(): Promise<{ balance: number; currency: string; error?: string }> {
    if (!this.apiKey || this.apiKey.length < 5) {
      return { balance: 0, currency: 'NGN' };
    }

    try {
      // LogsPoll official customer wallet endpoint
      const walletUrl = this.baseUrl.includes('/api/v1')
        ? `${this.baseUrl}/wallet`
        : 'https://logspoll.com/api/wallet';

      const resp = await fetch(walletUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const rawBal = typeof data.wallet?.balance === 'number'
          ? data.wallet.balance
          : typeof data.wallet?.balance_minor === 'number'
          ? data.wallet.balance_minor / 100
          : typeof data.balance === 'number'
          ? data.balance
          : Number(data.data?.balance || 0);
        const bal = Number(rawBal || 0);
        return {
          balance: bal,
          currency: data.wallet?.currency || data.currency || 'NGN'
        };
      }
    } catch (err: any) {
      console.warn(`[LOGSPOLL_BALANCE] Notice: ${err.message}`);
    }

    return { balance: 0, currency: 'NGN' };
  }

  async fetchCatalog(options?: { q?: string; mainCategory?: string; limit?: number }): Promise<LogsPollProduct[]> {
    try {
      const params = new URLSearchParams();
      params.set('availability', 'in-stock');
      if (options?.q) params.set('q', options.q);
      if (options?.mainCategory) params.set('main_category', options.mainCategory);
      if (options?.limit) params.set('limit', String(options.limit));

      const resp = await fetch(`${this.baseUrl}/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const list = Array.isArray(data) ? data : (data.records || data.data || data.products || []);
        return list.map((p: any) => {
          const wholesaleNgn = Number(
            typeof p.price_minor === 'number'
              ? p.price_minor / 100
              : (p.priceNgn || p.price || 0)
          );
          return {
            id: String(p.id || p.productId),
            title: String(p.name || p.title || 'Digital Product').replace(/^"+|"+$/g, '').trim(),
            category: String(p.category_name || p.category || 'Social & Tools'),
            priceNgn: wholesaleNgn,
            stockCount: Number(p.available_quantity ?? p.stockCount ?? p.stock ?? 10),
            deliveryFormat: p.delivery_type || p.deliveryFormat || 'Credentials / 2FA Token',
            description: p.description || ''
          };
        });
      }
    } catch (err: any) {
      console.warn(`[LOGSPOLL_CATALOG] Notice: ${err.message}`);
    }
    return [];
  }

  async orderProduct(productId: string, quantity: number = 1, idempotencyKey?: string): Promise<LogsPollOrderResult> {
    if (!this.apiKey) {
      return { success: false, status: 'error', error: 'LogsPoll API key not configured' };
    }

    const cleanProductId = productId.replace(/^lp_/, '');

    try {
      // 1. Initiate checkout on LogsPoll REST API
      const resp = await fetch(`${this.baseUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
        },
        body: JSON.stringify({
          items: [
            {
              product_id: cleanProductId,
              quantity
            }
          ],
          redirect_url: 'https://ojalogs.com.ng/dashboard?order=delivered'
        })
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const orderId = data.order_id || data.id || data.reference;

        // Try to fetch delivered credentials
        let credentials = data.secretKey || data.credentials || data.key;
        let instructions = data.instructions || 'Redeem credentials and secure with 2FA.';

        try {
          const ordResp = await fetch(`${this.baseUrl}/orders?purchases=true`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json'
            }
          });
          if (ordResp.ok) {
            const ordData = await ordResp.json() as any;
            const records = ordData.records || [];
            const match = records.find((r: any) => r.id === orderId || r.reference === data.reference);
            if (match?.order_items?.[0]?.product_entitlements?.instructions) {
              credentials = match.order_items[0].product_entitlements.instructions;
              instructions = 'Delivered via LogsPoll upstream API.';
            }
          }
        } catch {}

        return {
          success: true,
          orderId,
          reference: data.reference || `lp_ord_${Date.now()}`,
          status: data.status || 'completed',
          secretKey: credentials || `AUTH:LP_SUCCESS:${orderId}`,
          deliveryFormat: 'Encrypted Account Credentials & 2FA Token',
          instructions
        };
      } else {
        const text = await resp.text();
        return { success: false, status: 'rejected', error: `LogsPoll order rejected: ${text}` };
      }
    } catch (err: any) {
      return { success: false, status: 'network_error', error: err.message };
    }
  }
}

export const logspollAdapter = new LogsPollAdapter();

