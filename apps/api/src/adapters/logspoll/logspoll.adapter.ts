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
      const resp = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const bal = Number(data.balance ?? data.data?.balance ?? data.wallet?.balance ?? data.amount ?? 0);
        return {
          balance: bal,
          currency: data.currency || 'NGN'
        };
      }
    } catch (err: any) {
      console.warn(`[LOGSPOLL_BALANCE] Notice: ${err.message}`);
    }

    return { balance: 0, currency: 'NGN' };
  }

  async fetchCatalog(): Promise<LogsPollProduct[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/products?availability=in-stock`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const list = Array.isArray(data) ? data : (data.data || data.products || []);
        return list.map((p: any) => ({
          id: String(p.id || p.productId),
          title: String(p.title || p.name),
          category: String(p.category || 'Tools & Social Accounts'),
          priceNgn: Number(p.priceNgn || p.price || 0),
          stockCount: Number(p.stockCount || p.stock || 10),
          deliveryFormat: p.deliveryFormat || 'Credentials / License Token',
          description: p.description || ''
        }));
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

    try {
      const resp = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
        },
        body: JSON.stringify({
          productId,
          quantity
        })
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        return {
          success: true,
          orderId: data.id || data.orderId,
          reference: data.reference,
          status: data.status || 'completed',
          secretKey: data.secretKey || data.credentials || data.key,
          deliveryFormat: data.deliveryFormat || 'Instant Automated',
          instructions: data.instructions || 'Delivered automatically via LogsPoll'
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

