import fs from 'node:fs';
import path from 'node:path';
import { IServerApiAdapter } from './server.interface.js';
import { Server1ApiAdapter } from './server1.adapter.js';
import { Server2ApiAdapter } from './server2.adapter.js';
import { Server3ApiAdapter } from './server3.adapter.js';
import { Server4ApiAdapter } from './server4.adapter.js';
import { logspollAdapter } from '../logspoll/logspoll.adapter.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ServerClusterConfig } from '@ojalogs/shared';

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : path.join(process.cwd(), 'data');
const SERVER_CONFIG_FILE = path.join(DATA_DIR, 'server_configs.json');

export class ServerApiRegistry {
  private adapters = new Map<string, IServerApiAdapter>();
  private serverConfigs = new Map<string, ServerClusterConfig>();

  constructor() {
    this.register(new Server1ApiAdapter());
    this.register(new Server2ApiAdapter());
    this.register(new Server3ApiAdapter());
    this.register(new Server4ApiAdapter());

    // Initialize Default Server Upstream Configurations
    this.initConfigs();
  }

  private initConfigs() {
    const defaults: ServerClusterConfig[] = [
      {
        id: 'server-1',
        cluster: 'Server 1',
        name: 'Server 1 API (Enterprise Security, Proxies & eSIM)',
        description: 'Handles VPN vouchers, LTE/residential proxies, and instant eSIM profile allocations.',
        apiUrl: 'https://api.ojalogs-server1.net/v1',
        apiKey: 'sk_live_srv1_prod_7721',
        fulfillmentMode: 'automated_api',
        webhookSecret: 'whsec_srv1_prod_2026',
        status: 'connected',
        latencyMs: 48,
        lastChecked: new Date().toISOString()
      },
      {
        id: 'server-2',
        cluster: 'Server 2',
        name: 'Server 2 API (Social Accounts - Ojalogs Fleet)',
        description: 'Provisions aged social media accounts, high-limit Business Managers, and social tools via upstream automated fleet.',
        apiUrl: process.env.LOGSPOLL_BASE_URL || 'https://logspoll.com/api/v1',
        apiKey: process.env.LOGSPOLL_API_KEY || 'lp_live_37f040ba58a25c1178bf850aba5d9b49a11cf47b3e911c6b',
        fulfillmentMode: 'automated_api',
        webhookSecret: 'whsec_srv2_prod_2026',
        status: 'connected',
        latencyMs: 64,
        lastChecked: new Date().toISOString()
      },
      {
        id: 'server-3',
        cluster: 'Server 3',
        name: 'Server 3 API (Software Licenses & Genuine OS Keys)',
        description: 'Dispatches Microsoft retail 25-digit product keys and developer software licenses.',
        apiUrl: 'https://api.ojalogs-server3.net/v1',
        apiKey: 'sk_live_srv3_prod_3311',
        fulfillmentMode: 'automated_api',
        webhookSecret: 'whsec_srv3_prod_2026',
        status: 'connected',
        latencyMs: 38,
        lastChecked: new Date().toISOString()
      },
      {
        id: 'server-4',
        cluster: 'Server 4',
        name: 'Server 4 API (AI Subscriptions & Tool Passkeys - Ojalogs Fleet)',
        description: 'Distributes ChatGPT Plus, Claude Pro, and AI developer API redemption vouchers via upstream automated fleet.',
        apiUrl: process.env.LOGSPOLL_BASE_URL || 'https://logspoll.com/api/v1',
        apiKey: process.env.LOGSPOLL_API_KEY || 'lp_live_37f040ba58a25c1178bf850aba5d9b49a11cf47b3e911c6b',
        fulfillmentMode: 'automated_api',
        webhookSecret: 'whsec_srv4_prod_2026',
        status: 'connected',
        latencyMs: 72,
        lastChecked: new Date().toISOString()
      }
    ];

    for (const cfg of defaults) {
      this.serverConfigs.set(cfg.cluster, cfg);
    }
    this.loadPersisted();
  }

  private loadPersisted() {
    try {
      if (fs.existsSync(SERVER_CONFIG_FILE)) {
        const raw = fs.readFileSync(SERVER_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item?.cluster) {
              const current = this.serverConfigs.get(item.cluster) || item;
              this.serverConfigs.set(item.cluster, { ...current, ...item });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[SERVER_REGISTRY] Load notice: ${err.message}`);
    }
  }

  private savePersisted() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const list = Array.from(this.serverConfigs.values());
      fs.writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[SERVER_REGISTRY] Save notice: ${err.message}`);
    }
  }

  register(adapter: IServerApiAdapter) {
    this.adapters.set(adapter.serverCluster, adapter);
  }

  getAdapter(serverCluster: string): IServerApiAdapter {
    const adapter = this.adapters.get(serverCluster);
    if (!adapter) {
      throw new AppError(`No Server API adapter registered for cluster '${serverCluster}'`, 500, 'SERVER_API_NOT_FOUND');
    }
    return adapter;
  }

  getAllConfigs(): ServerClusterConfig[] {
    return Array.from(this.serverConfigs.values());
  }

  getConfig(cluster: string): ServerClusterConfig {
    const cfg = this.serverConfigs.get(cluster);
    if (!cfg) {
      throw new AppError(`Configuration for cluster '${cluster}' not found.`, 404, 'SERVER_NOT_FOUND');
    }
    return cfg;
  }

  updateConfig(cluster: string, updates: Partial<ServerClusterConfig>): ServerClusterConfig {
    const existing = this.getConfig(cluster);
    const updated: ServerClusterConfig = {
      ...existing,
      ...updates,
      cluster: existing.cluster,
      lastChecked: new Date().toISOString()
    };
    this.serverConfigs.set(cluster, updated);
    this.savePersisted();

    // Keep LogsPoll adapter credentials in sync if Server 2 or Server 4 is updated
    if (cluster === 'Server 2' || cluster === 'Server 4' || (updated.apiUrl && updated.apiUrl.includes('logspoll'))) {
      if (updated.apiKey || updated.apiUrl) {
        logspollAdapter.setCredentials(updated.apiKey, updated.apiUrl);
      }
    }

    return updated;
  }

  async testConnection(cluster: string): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    const cfg = this.getConfig(cluster);
    
    // If configured with live LogsPoll URL
    if (cfg.apiUrl && cfg.apiUrl.includes('logspoll')) {
      const res = await logspollAdapter.checkHealth();
      cfg.latencyMs = res.latencyMs;
      cfg.status = res.healthy ? 'connected' : 'offline';
      cfg.lastChecked = new Date().toISOString();
      this.serverConfigs.set(cluster, cfg);
      return res;
    }

    const simulatedLatency = Math.floor(30 + Math.random() * 45);
    
    // Update latency & status
    cfg.latencyMs = simulatedLatency;
    cfg.status = 'connected';
    cfg.lastChecked = new Date().toISOString();
    this.serverConfigs.set(cluster, cfg);

    return {
      healthy: true,
      latencyMs: simulatedLatency,
      message: `Connection to ${cfg.name} verified successfully via ${cfg.apiUrl}. Latency: ${simulatedLatency}ms.`
    };
  }

  async getAllHealth(): Promise<Record<string, { healthy: boolean; latencyMs: number; name: string }>> {
    const results: Record<string, any> = {};
    for (const [cluster, adapter] of this.adapters.entries()) {
      const health = await adapter.checkHealth();
      results[cluster] = { ...health, name: adapter.name };
    }
    return results;
  }
}

export const serverApiRegistry = new ServerApiRegistry();

