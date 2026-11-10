import { bachGateway } from '../gateways/bach.gateway.js';
import { smmService } from './smm.service.js';
import { linkocialAdapter } from '../adapters/smm/linkocial.adapter.js';
import { telephonyRegistry } from '../adapters/telephony/telephony.registry.js';
import { numbersService } from './numbers.service.js';

export interface UpstreamServiceBalance {
  id: string;
  name: string;
  category: 'payment_gateway' | 'smm_provider' | 'telephony_provider' | 'server_cluster';
  balance: number;
  currency: string;
  status: 'connected' | 'standby' | 'error' | 'unconfigured';
  latencyMs?: number;
  note?: string;
  lastChecked: string;
}

export class BalanceService {
  async getAllBalances(): Promise<UpstreamServiceBalance[]> {
    const results: UpstreamServiceBalance[] = [];
    const now = new Date().toISOString();

    // 1. Bachs Payment Gateway
    try {
      const bachStart = Date.now();
      const bachBal = await bachGateway.getBalance();
      const latencyMs = Date.now() - bachStart;
      results.push({
        id: 'bach',
        name: 'BACH Payment Gateway',
        category: 'payment_gateway',
        balance: bachBal.balance,
        currency: bachBal.currency || 'NGN',
        status: bachBal.balance >= 0 ? 'connected' : 'standby',
        latencyMs,
        note: 'Customer settlement balance available for withdrawal',
        lastChecked: now
      });
    } catch (err: any) {
      results.push({
        id: 'bach',
        name: 'BACH Payment Gateway',
        category: 'payment_gateway',
        balance: 0,
        currency: 'NGN',
        status: 'error',
        note: `Error: ${err.message}`,
        lastChecked: now
      });
    }

    // 2. Linkocial SMM Provider
    try {
      const smmStart = Date.now();
      const smmConfig = await smmService.getProviderConfig();
      let balNgn: number = Number(smmConfig.balanceNgn || 0);
      let status: 'connected' | 'standby' | 'error' | 'unconfigured' =
        smmConfig.connectionStatus === 'connected' ? 'connected' :
        smmConfig.connectionStatus === 'error' ? 'error' : 'unconfigured';

      if (smmConfig.apiKey && smmConfig.apiKey !== 'linkocial_live_token_default') {
        const liveRes = await linkocialAdapter.getBalance();
        if (liveRes.balance !== undefined && !liveRes.error) {
          balNgn = Number(liveRes.balance);
          status = 'connected';
        }
      }

      results.push({
        id: 'linkocial',
        name: 'Linkocial SMM Engine',
        category: 'smm_provider',
        balance: balNgn,
        currency: 'NGN',
        status,
        latencyMs: Date.now() - smmStart,
        note: 'Prepaid balance for Instagram, TikTok & YouTube boosts',
        lastChecked: now
      });
    } catch (err: any) {
      results.push({
        id: 'linkocial',
        name: 'Linkocial SMM Engine',
        category: 'smm_provider',
        balance: 0,
        currency: 'NGN',
        status: 'error',
        note: `Error: ${err.message}`,
        lastChecked: now
      });
    }

    // 3. TextPlug Telephony Hub
    try {
      const textplug = telephonyRegistry.get('provider-textplug');
      const hasKey = Boolean(textplug?.apiKey && textplug.apiKey.trim().length > 10);
      const activeCount = numbersService.getActiveSessionsCount();

      results.push({
        id: 'textplug',
        name: 'TextPlug Telephony Hub',
        category: 'telephony_provider',
        balance: activeCount, // Number of active line rentals
        currency: 'Lines',
        status: hasKey ? 'connected' : 'unconfigured',
        latencyMs: textplug?.latencyMs || 42,
        note: hasKey
          ? `Online (textplug.net) · ${activeCount} active lines leased`
          : 'API Key required to query real line pools',
        lastChecked: now
      });
    } catch (err: any) {
      results.push({
        id: 'textplug',
        name: 'TextPlug Telephony Hub',
        category: 'telephony_provider',
        balance: 0,
        currency: 'Lines',
        status: 'error',
        note: err.message,
        lastChecked: now
      });
    }

    return results;
  }
}

export const balanceService = new BalanceService();
