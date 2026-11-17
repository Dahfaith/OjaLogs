import { env } from '../../config/env.js';

export interface LogsPollProduct {
  id: string;
  title: string;
  category: string;
  priceNgn: number;
  stockCount: number;
  serverNumber?: number;
  serverCluster?: string;
  deliveryFormat?: string;
  description?: string;
  slug?: string;
}

export interface LogsPollPaginatedResult {
  records: LogsPollProduct[];
  total: number;
  pages: number;
  page: number;
  limit: number;
  inStock: number;
  outOfStock: number;
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

  async fetchCatalog(options?: { q?: string; category?: string; mainCategory?: string; limit?: number }): Promise<LogsPollProduct[]> {
    try {
      const params = new URLSearchParams();
      params.set('availability', 'in-stock');
      if (options?.category) params.set('category', options.category);
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

  async fetchCatalogPaginated(options?: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    server?: number | string;
    availability?: string;
  }): Promise<LogsPollPaginatedResult> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, Math.min(100, options?.limit || 20));

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (options?.availability && options.availability !== 'All') {
        params.set('availability', options.availability);
      } else {
        params.set('availability', 'in-stock');
      }
      if (options?.category) params.set('category', options.category);
      if (options?.q) params.set('q', options.q);
      if (options?.server) params.set('server', String(options.server));

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
        const total = Number(data.total ?? data.total_products ?? data.totalCount ?? data.pagination?.total ?? (list.length > 0 ? 4797 : list.length));
        const pages = Number(data.pages ?? data.totalPages ?? data.pagination?.pages ?? Math.max(1, Math.ceil(total / limit)));
        const inStock = Number(data.in_stock ?? data.inStock ?? data.total_in_stock ?? total);
        const outOfStock = Number(data.out_of_stock ?? data.outOfStock ?? Math.max(0, total - inStock));

        const records = list.map((p: any) => {
          const wholesaleNgn = Number(
            typeof p.price_minor === 'number'
              ? p.price_minor / 100
              : (p.priceNgn || p.price || 0)
          );
          const serverNum = Number(p.server_number || (typeof options?.server === 'number' ? options.server : 2));
          return {
            id: String(p.id || p.productId),
            slug: p.slug || `lp-${String(p.id).slice(0, 8)}`,
            title: String(p.name || p.title || 'Digital Product').replace(/^"+|"+$/g, '').trim(),
            category: String(p.category_name || p.category || 'Social & Tools'),
            priceNgn: wholesaleNgn,
            stockCount: Number(p.available_quantity ?? p.stockCount ?? p.stock ?? 10),
            serverNumber: serverNum,
            serverCluster: `Server ${serverNum}`,
            deliveryFormat: p.delivery_type || p.deliveryFormat || 'Credentials / 2FA Token',
            description: p.description || ''
          };
        });

        return {
          records,
          total,
          pages,
          page,
          limit,
          inStock,
          outOfStock
        };
      }
    } catch (err: any) {
      console.warn(`[LOGSPOLL_CATALOG_PAGINATED] Notice: ${err.message}`);
    }

    return {
      records: [],
      total: 0,
      pages: 1,
      page,
      limit,
      inStock: 0,
      outOfStock: 0
    };
  }

  async fetchProduct(productId: string): Promise<LogsPollProduct | null> {
    const cleanId = productId.replace(/^lp_/, '');
    try {
      const resp = await fetch(`${this.baseUrl}/products/${cleanId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const p = data.record || data.product || data;
        if (p && (p.id || p.name)) {
          const wholesaleNgn = Number(
            typeof p.price_minor === 'number'
              ? p.price_minor / 100
              : (p.priceNgn || p.price || 0)
          );
          const serverNum = Number(p.server_number || 2);
          return {
            id: String(p.id || cleanId),
            slug: p.slug || `lp-${String(cleanId).slice(0, 8)}`,
            title: String(p.name || p.title || 'Digital Product').replace(/^"+|"+$/g, '').trim(),
            category: String(p.category_name || p.category || 'Social & Tools'),
            priceNgn: wholesaleNgn,
            stockCount: Number(p.available_quantity ?? p.stockCount ?? p.stock ?? 10),
            serverNumber: serverNum,
            serverCluster: `Server ${serverNum}`,
            deliveryFormat: p.delivery_type || p.deliveryFormat || 'Credentials / 2FA Token',
            description: p.description || ''
          };
        }
      }
    } catch (err: any) {
      console.warn(`[LOGSPOLL_FETCH_PRODUCT] Notice: ${err.message}`);
    }
    return null;
  }

  async orderProduct(productId: string, quantity: number = 1, idempotencyKey?: string): Promise<LogsPollOrderResult> {
    if (!this.apiKey) {
      return { success: false, status: 'error', error: 'LogsPoll API key not configured' };
    }

    const cleanProductId = productId.replace(/^lp_/, '');

    try {
      // 1. Initiate purchase on LogsPoll official orders endpoint using reseller wallet balance
      const resp = await fetch(`${this.baseUrl}/orders`, {
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
          ]
        })
      });

      if (resp.ok || resp.status === 201) {
        const data = await resp.json() as any;
        const orderId = data.orderId || data.order_id || data.id || data.reference;
        const reference = data.reference || `LP-${orderId}`;

        console.log(`[LOGSPOLL_ORDER_SUCCESS] Upstream order created: ${orderId} (${reference}). Balance after: ${data.balanceAfter ?? data.balanceAfterMinor}`);

        // 2. Retrieve delivered credentials from LogsPoll purchases vault
        let credentials = data.secretKey || data.credentials || data.key || data.account || data.code;
        let deliveryFormat = 'Credentials / 2FA Token';
        let instructions = 'Delivered via LogsPoll automated upstream API.';

        if (!credentials && orderId) {
          try {
            // Attempt targeted fetch of the specific order
            for (let attempt = 0; attempt < 3; attempt++) {
              if (attempt > 0) {
                await new Promise(r => setTimeout(r, 800));
              }

              // First try direct single order lookup
              let match: any = null;
              try {
                const singleResp = await fetch(`${this.baseUrl}/orders/${orderId}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                  }
                });
                if (singleResp.ok) {
                  const sData = await singleResp.json() as any;
                  match = sData.record || sData.order || sData;
                }
              } catch {}

              // If single lookup not supported, query purchases list and strictly match orderId/reference
              if (!match) {
                const ordResp = await fetch(`${this.baseUrl}/orders?purchases=true`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                  }
                });

                if (ordResp.ok) {
                  const ordData = await ordResp.json() as any;
                  const records = ordData.records || ordData.data || ordData.orders || [];
                  // STRICT order isolation: only match exact orderId or reference
                  match = records.find((r: any) => String(r.id) === String(orderId) || String(r.reference) === String(reference));
                }
              }

              if (match) {
                // STRICT item matching: must match cleanProductId
                const itemWithEntitlement = match?.order_items?.find((i: any) =>
                  String(i.product_id) === String(cleanProductId) || String(i.productId) === String(cleanProductId)
                ) || (match?.order_items?.length === 1 ? match.order_items[0] : null);

                const ent = itemWithEntitlement?.product_entitlements || itemWithEntitlement?.entitlement || match?.product_entitlements;
                if (ent) {
                  credentials = ent.raw || ent.instructions || ent.structured?.accounts?.[0]?.raw || ent.structured?.raw || (typeof ent === 'string' ? ent : credentials);
                  if (Array.isArray(ent.structured?.instructions) && ent.structured.instructions.length > 0) {
                    instructions = ent.structured.instructions.join('\n');
                  } else if (typeof ent.instructions === 'string' && ent.instructions.length > 0) {
                    instructions = ent.instructions;
                  }
                  if (ent.structured?.productType === 'social' || deliveryFormat.includes('Credentials')) {
                    deliveryFormat = 'Username:Password:2FA Key / Session Cookies';
                  }
                  if (credentials) break;
                } else if (itemWithEntitlement?.secretKey || itemWithEntitlement?.credentials) {
                  credentials = itemWithEntitlement.secretKey || itemWithEntitlement.credentials;
                  if (credentials) break;
                }
              }
            }
          } catch (vaultErr: any) {
            console.warn(`[LOGSPOLL_VAULT_FETCH_NOTICE] ${vaultErr.message}`);
          }
        }

        // If credentials are still missing, do NOT fabricate dummy secrets!
        if (!credentials) {
          console.warn(`[LOGSPOLL_FULFILLMENT_PENDING] Order ${orderId} created but credentials not yet delivered by upstream`);
          return {
            success: false,
            orderId,
            reference,
            status: 'fulfillment_pending',
            error: 'Upstream order accepted but digital credentials are pending extraction from provider vault'
          };
        }

        return {
          success: true,
          orderId,
          reference,
          status: 'completed',
          secretKey: credentials,
          deliveryFormat,
          instructions
        };
      } else {
        const text = await resp.text();
        console.warn(`[LOGSPOLL_ORDER_REJECTED] HTTP ${resp.status}: ${text}`);
        return { success: false, status: 'rejected', error: `LogsPoll order rejected (${resp.status}): ${text}` };
      }
    } catch (err: any) {
      console.error(`[LOGSPOLL_ORDER_ERROR] ${err.message}`);
      return { success: false, status: 'network_error', error: err.message };
    }
  }
}

export const logspollAdapter = new LogsPollAdapter();

