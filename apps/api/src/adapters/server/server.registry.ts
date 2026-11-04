import { IServerApiAdapter } from './server.interface.js';
import { Server1ApiAdapter } from './server1.adapter.js';
import { Server2ApiAdapter } from './server2.adapter.js';
import { Server3ApiAdapter } from './server3.adapter.js';
import { Server4ApiAdapter } from './server4.adapter.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ServerApiRegistry {
  private adapters = new Map<string, IServerApiAdapter>();

  constructor() {
    this.register(new Server1ApiAdapter());
    this.register(new Server2ApiAdapter());
    this.register(new Server3ApiAdapter());
    this.register(new Server4ApiAdapter());
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

