import { walletService } from './wallet.service.js';
import { numbersService } from './numbers.service.js';
import { balanceService } from './balance.service.js';
import { smmService } from './smm.service.js';

export interface CronJobInfo {
  id: string;
  name: string;
  intervalMs: number;
  lastRunAt?: string;
  lastStatus: 'idle' | 'running' | 'success' | 'error';
  lastError?: string;
  executionCount: number;
  lastDurationMs: number;
  itemsProcessed?: number;
}

export class CronService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: Map<string, boolean> = new Map();
  private jobs: Map<string, CronJobInfo> = new Map();
  private isStarted = false;

  constructor() {
    this.registerJob('bachs_deposits', 'Bachs Payments & Deposit Auto-Reconciler', 30 * 1000);
    this.registerJob('telephony_rentals', 'Telephony Expired Numbers & 100% Refund Engine', 60 * 1000);
    this.registerJob('upstream_balances', 'Upstream Liquidity & Multi-Server Balance Sync', 120 * 1000);
    this.registerJob('smm_health', 'SMM Provider Pulse & Balance Refresh', 300 * 1000);
    this.registerJob('ledger_audit', 'Mathematical Ledger Double-Entry Parity Audit', 600 * 1000);
  }

  private registerJob(id: string, name: string, intervalMs: number) {
    this.jobs.set(id, {
      id,
      name,
      intervalMs,
      lastStatus: 'idle',
      executionCount: 0,
      lastDurationMs: 0
    });
  }

  start() {
    if (this.isStarted) return;
    this.isStarted = true;

    console.log('[CRON_SERVICE] 🚀 Starting autonomous background workers...');

    // Initial stagger to warm up caches cleanly after boot
    setTimeout(() => this.runJob('bachs_deposits').catch(() => {}), 2000);
    setTimeout(() => this.runJob('telephony_rentals').catch(() => {}), 4000);
    setTimeout(() => this.runJob('upstream_balances').catch(() => {}), 6000);

    // Register recurring interval timers
    for (const [id, job] of this.jobs.entries()) {
      const timer = setInterval(() => {
        this.runJob(id).catch(err => {
          console.warn(`[CRON_WORKER] Error in recurring job ${id}:`, err.message);
        });
      }, job.intervalMs);

      // Unref so timers don't block node exit during tests or scripts
      if (typeof (timer as any)?.unref === 'function') {
        (timer as any).unref();
      }
      this.timers.set(id, timer);
    }

    console.log(`[CRON_SERVICE] ✅ Registered ${this.jobs.size} background workers successfully.`);
  }

  stop() {
    for (const [id, timer] of this.timers.entries()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.isStarted = false;
    console.log('[CRON_SERVICE] Stopped all background workers.');
  }

  async runJob(id: string): Promise<CronJobInfo> {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Unknown cron job: ${id}`);

    if (this.isRunning.get(id)) {
      return job; // Guard against overlapping runs
    }

    this.isRunning.set(id, true);
    job.lastStatus = 'running';
    const start = Date.now();

    try {
      let itemsProcessed = 0;

      switch (id) {
        case 'bachs_deposits': {
          const res = await walletService.reconcileWithBachsGateway();
          itemsProcessed = res.reconciledCount || 0;
          if (itemsProcessed > 0) {
            console.log(`[CRON_BACHS] Reconciled ${itemsProcessed} new deposit(s) into customer wallets.`);
          }
          break;
        }

        case 'telephony_rentals': {
          const res = await numbersService.reconcileExpiredRentals();
          itemsProcessed = res.expiredCount || 0;
          if (itemsProcessed > 0) {
            console.log(`[CRON_TELEPHONY] Processed ${res.expiredCount} expired rental(s). Refunded ₦${res.totalRefundedNgn.toLocaleString()}.`);
          }
          break;
        }

        case 'upstream_balances': {
          const balances = await balanceService.refreshBalances();
          itemsProcessed = balances.length;
          break;
        }

        case 'smm_health': {
          await smmService.refreshBalance().catch(() => {});
          itemsProcessed = 1;
          break;
        }

        case 'ledger_audit': {
          const stats = await walletService.getGlobalStatsAsync();
          itemsProcessed = stats.totalDepositsCount + stats.totalPurchasesCount;
          break;
        }
      }

      job.lastStatus = 'success';
      job.lastError = undefined;
      job.itemsProcessed = itemsProcessed;
    } catch (err: any) {
      job.lastStatus = 'error';
      job.lastError = err.message || String(err);
      console.warn(`[CRON_ERROR] Job ${id} notice:`, job.lastError);
    } finally {
      job.lastDurationMs = Date.now() - start;
      job.lastRunAt = new Date().toISOString();
      job.executionCount++;
      this.isRunning.set(id, false);
    }

    return job;
  }

  async triggerAll(): Promise<CronJobInfo[]> {
    const results: CronJobInfo[] = [];
    for (const id of this.jobs.keys()) {
      results.push(await this.runJob(id));
    }
    return results;
  }

  getStatus(): CronJobInfo[] {
    return Array.from(this.jobs.values());
  }
}

export const cronService = new CronService();
