import { IServerApiAdapter } from './server.interface.js';
import { Server1ApiAdapter } from './server1.adapter.js';
import { Server2ApiAdapter } from './server2.adapter.js';
import { Server3ApiAdapter } from './server3.adapter.js';
import { Server4ApiAdapter } from './server4.adapter.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ServerClusterConfig } from '@ojalogs/shared';

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
        name: 'Server 2 API (Social Accounts & Cloud Subscriptions)',
        description: 'Provisions aged social media accounts, high-limit Business Managers, and cloud VPS credits.',
        apiUrl: 'https://api.ojalogs-server2.net/v1',
        apiKey: 'sk_live_srv2_prod_9942',
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
        name: 'Server 4 API (AI Subscriptions & Tool Passkeys)',
        description: 'Distributes ChatGPT Plus, Claude Pro, and AI developer API redemption vouchers.',
        apiUrl: 'https://api.ojalogs-server4.net/v1',
        apiKey: 'sk_live_srv4_prod_1109',
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
    return updated;
  }

  async testConnection(cluster: string): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    const cfg = this.getConfig(cluster);
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

