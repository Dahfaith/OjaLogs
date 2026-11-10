import { bachGateway } from '../gateways/bach.gateway.js';
import { smmService } from './smm.service.js';
import { linkocialAdapter } from '../adapters/smm/linkocial.adapter.js';
import { telephonyRegistry } from '../adapters/telephony/telephony.registry.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';
import { numbersService } from './numbers.service.js';

export interface UpstreamServiceBalance {
  id: string;
  name: string;
  category: 'payment_gateway' | 'smm_provider' | 'telephony_provider' | 'server_provider' | 'server_cluster';
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
      const hasKey = Boolean((textplug?.apiKey || process.env.TEXTPLUG_API_KEY || '').trim().length > 5);
      const activeCount = numbersService.getActiveSessionsCount();
      const tpBal = await telephonyRegistry.getBalance('provider-textplug');

      results.push({
        id: 'textplug',
        name: 'TextPlug Telephony Hub',
        category: 'telephony_provider',
        balance: tpBal.balance, // Real live NGN balance, e.g. ₦1,150.00
        currency: 'NGN',
        status: hasKey ? 'connected' : 'unconfigured',
        latencyMs: textplug?.latencyMs || 42,
        note: hasKey
          ? `TextPlug Wallet: ₦${tpBal.balance.toLocaleString()} · ${activeCount} active lines leased (${tpBal.purchasedNumbers || 0} lifetime)`
          : 'API Key required to query real line pools',
        lastChecked: now
      });
    } catch (err: any) {
      results.push({
        id: 'textplug',
        name: 'TextPlug Telephony Hub',
        category: 'telephony_provider',
        balance: 0,
        currency: 'NGN',
        status: 'error',
        note: err.message,
        lastChecked: now
      });
    }

    // 4. LogsPoll Social Accounts & Tools Hub (logspoll.com)
    try {
      const lpStart = Date.now();
      const lpCreds = logspollAdapter.getCredentials();
      const lpBal = await logspollAdapter.getBalance();
      const isConfigured = lpCreds.isConfigured;

      results.push({
        id: 'logspoll',
        name: 'LogsPoll Social Media & Tools Hub',
        category: 'server_provider',
        balance: lpBal.balance,
        currency: 'NGN',
        status: isConfigured ? 'connected' : 'unconfigured',
        latencyMs: Date.now() - lpStart,
        note: isConfigured
          ? 'Live liquidity for Social Accounts & Digital Tools (logspoll.com)'
          : 'Ready for API Key (Bearer lp_live_...) in Admin Settings',
        lastChecked: now
      });
    } catch (err: any) {
      results.push({
        id: 'logspoll',
        name: 'LogsPoll Social Media & Tools Hub',
        category: 'server_provider',
        balance: 0,
        currency: 'NGN',
        status: 'error',
        note: err.message,
        lastChecked: now
      });
    }

    return results;
  }
}

export const balanceService = new BalanceService();
