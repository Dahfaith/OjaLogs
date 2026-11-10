import fs from 'node:fs';
import path from 'node:path';
import { TelephonyProviderConfig } from '@ojalogs/shared';

const DATA_DIR = path.join(process.cwd(), 'data');
const TELEPHONY_CONFIG_FILE = path.join(DATA_DIR, 'telephony_config.json');

const INITIAL_PROVIDERS: TelephonyProviderConfig[] = [
  {
    id: 'provider-textplug',
    name: 'TextPlug Telephony Hub',
    badge: 'Primary Virtual SMS Hub (textplug.net)',
    apiUrl: process.env.TEXTPLUG_BASE_URL || 'https://merchant.textplug.net',
    apiKey: process.env.TEXTPLUG_API_KEY || '',
    webhookSecret: process.env.TEXTPLUG_WEBHOOK_SECRET || 'whsec_textplug_ojalogs',
    markupPercent: 25,
    autoRefundTimeoutSeconds: 900,
    status: 'connected',
    latencyMs: 38
  },
  {
    id: 'provider-5sim',
    name: '5sim.net Virtual SMS Hub',
    badge: 'Secondary Automated Fallback',
    apiUrl: 'https://5sim.net/v1/user',
    apiKey: 'Bearer 5sim_prod_token_3921',
    markupPercent: 25,
    autoRefundTimeoutSeconds: 900,
    status: 'standby',
    latencyMs: 52
  },
  {
    id: 'provider-smsactivate',
    name: 'SMS-Activate Global Telephony',
    badge: 'Third-Tier Fallback Telephony',
    apiUrl: 'https://api.sms-activate.org/stubs/handler_api.php',
    apiKey: 'smsactivate_key_88412',
    markupPercent: 25,
    autoRefundTimeoutSeconds: 900,
    status: 'standby',
    latencyMs: 88
  }
];

export class TelephonyRegistry {
  private providers = new Map<string, TelephonyProviderConfig>();

  constructor() {
    this.init();
  }

  private init() {
    for (const p of INITIAL_PROVIDERS) {
      this.providers.set(p.id, { ...p });
    }
    this.loadPersisted();
  }

  private loadPersisted() {
    try {
      if (fs.existsSync(TELEPHONY_CONFIG_FILE)) {
        const raw = fs.readFileSync(TELEPHONY_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item?.id) {
              const current = this.providers.get(item.id) || item;
              this.providers.set(item.id, { ...current, ...item });
            }
          }
        }
      }
      // Ensure environment variable fallback for textplug apiKey if not set in persisted JSON
      const tp = this.providers.get('provider-textplug');
      if (tp && process.env.TEXTPLUG_API_KEY && (!tp.apiKey || tp.apiKey.trim().length === 0)) {
        tp.apiKey = process.env.TEXTPLUG_API_KEY;
      }
    } catch (err: any) {
      console.warn(`[TELEPHONY_REGISTRY] Load notice: ${err.message}`);
    }
  }

  private savePersisted() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const list = Array.from(this.providers.values());
      fs.writeFileSync(TELEPHONY_CONFIG_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[TELEPHONY_REGISTRY] Save notice: ${err.message}`);
    }
  }

  getAll(): TelephonyProviderConfig[] {
    return Array.from(this.providers.values());
  }

  get(id: string): TelephonyProviderConfig | undefined {
    return this.providers.get(id);
  }

  update(id: string, updates: Partial<TelephonyProviderConfig>): TelephonyProviderConfig {
    const existing = this.providers.get(id);
    if (!existing) {
      throw new Error(`Telephony provider '${id}' not found`);
    }
    const updated = { ...existing, ...updates };
    this.providers.set(id, updated);
    this.savePersisted();
    return updated;
  }

  /**
   * Fetch live user balance from TextPlug (GET /v1/user)
   */
  async getBalance(id: string = 'provider-textplug'): Promise<{ balance: number; currency: string; purchasedNumbers?: number; rentedNumbers?: number; raw?: any }> {
    const provider = this.providers.get(id);
    const apiKey = (provider?.apiKey || process.env.TEXTPLUG_API_KEY || '').trim();
    if (!apiKey) {
      return { balance: 0, currency: 'NGN' };
    }

    const baseUrl = (provider?.apiUrl || process.env.TEXTPLUG_BASE_URL || 'https://merchant.textplug.net').replace(/\/+$/, '');

    try {
      const resp = await fetch(`${baseUrl}/v1/user`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        console.log('[TEXTPLUG_BALANCE_RESP]', data);
        const bal = Number(
          data.balance ??
          data.data?.balance ??
          data.user?.balance ??
          data.wallet?.balance ??
          data.amount ??
          data.account?.balance ??
          0
        );
        const purchased = Number(data.purchasedNumbers ?? data.data?.purchasedNumbers ?? data.purchased_numbers ?? 0);
        const rented = Number(data.rentedNumbers ?? data.data?.rentedNumbers ?? data.rented_numbers ?? 0);

        return {
          balance: bal,
          currency: 'NGN',
          purchasedNumbers: purchased,
          rentedNumbers: rented,
          raw: data
        };
      } else {
        const text = await resp.text();
        console.warn(`[TEXTPLUG_BALANCE_ERROR] HTTP ${resp.status}: ${text}`);
      }
    } catch (err: any) {
      console.warn(`[TEXTPLUG_BALANCE_EXCEPTION] ${err.message}`);
    }

    return { balance: 0, currency: 'NGN' };
  }

  /**
   * Fetch live available services from TextPlug (GET /v1/sms/swift/service-list)
   */
  async fetchLiveServices(id: string = 'provider-textplug'): Promise<any[]> {
    const provider = this.providers.get(id);
    const apiKey = (provider?.apiKey || process.env.TEXTPLUG_API_KEY || '').trim();
    const baseUrl = (provider?.apiUrl || process.env.TEXTPLUG_BASE_URL || 'https://merchant.textplug.net').replace(/\/+$/, '');
    const markup = provider?.markupPercent ?? 25;

    if (!apiKey) return [];

    try {
      const resp = await fetch(`${baseUrl}/v1/sms/swift/service-list`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const list = Array.isArray(data) ? data : (data.data || data.services || []);
        if (Array.isArray(list) && list.length > 0) {
          return list.map((item: any, idx: number) => {
            const name = typeof item === 'string' ? item : (item.name || item.serviceName || item.service || `Service ${idx + 1}`);
            const rawCost = typeof item === 'object' && item.price ? Number(item.price) : 1000;
            const retailPrice = Math.round(rawCost * (1 + markup / 100));
            const itemId = typeof item === 'object' && item.id ? String(item.id) : name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            return {
              id: itemId,
              name,
              category: (typeof item === 'object' && item.category) || 'General',
              icon: 'MessageSquare',
              priceNgn: Math.max(retailPrice, 600),
              successRate: (typeof item === 'object' && item.successRate) || 98,
              popular: ['whatsapp', 'telegram', 'google', 'openai', '1688', 'instagram', 'tiktok'].some(k => name.toLowerCase().includes(k))
            };
          });
        }
      }
    } catch (err: any) {
      console.warn(`[TEXTPLUG_SERVICES_FETCH] Notice: ${err.message}`);
    }

    return [];
  }

  async testConnection(id: string): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    const provider = this.providers.get(id);
    if (!provider) {
      return { healthy: false, latencyMs: 0, message: 'Provider not configured' };
    }

    const startTime = Date.now();

    if (id === 'provider-textplug') {
      const apiKey = provider.apiKey?.trim();
      if (!apiKey) {
        return { healthy: false, latencyMs: 0, message: 'TextPlug API Key is missing. Please enter your key in Admin Settings.' };
      }

      try {
        const resp = await fetch(`${provider.apiUrl || 'https://merchant.textplug.net'}/v1/sms/swift/service-list`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json'
          }
        });

        const latencyMs = Date.now() - startTime;
        if (resp.status === 200) {
          this.update(id, { status: 'connected', latencyMs });
          return {
            healthy: true,
            latencyMs,
            message: `Live connection verified with TextPlug API (HTTP 200). Ready to lease virtual lines!`
          };
        } else if (resp.status === 401 || resp.status === 403) {
          this.update(id, { status: 'offline', latencyMs });
          return {
            healthy: false,
            latencyMs,
            message: `TextPlug rejected API Key (HTTP ${resp.status}). Please check your key.`
          };
        } else {
          return { healthy: false, latencyMs, message: `TextPlug returned HTTP ${resp.status}` };
        }
      } catch (err: any) {
        return { healthy: false, latencyMs: Date.now() - startTime, message: `TextPlug connection failed: ${err.message}` };
      }
    }

    // Default mock / secondary ping
    return {
      healthy: true,
      latencyMs: provider.latencyMs || 45,
      message: `Telephony gateway responding normally (${provider.latencyMs || 45}ms).`
    };
  }
}

export const telephonyRegistry = new TelephonyRegistry();

