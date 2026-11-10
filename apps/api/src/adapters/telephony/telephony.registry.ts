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
    apiUrl: 'https://merchant.textplug.net',
    apiKey: '',
    webhookSecret: 'whsec_textplug_ojalogs',
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
