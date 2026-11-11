import fs from 'node:fs';
import path from 'node:path';
import { AppError } from '../middleware/errorHandler.js';
import { LedgerTransaction, LedgerCategory, LedgerEntryType } from '@ojalogs/shared';
import { bachGateway } from '../gateways/bach.gateway.js';

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : path.join(process.cwd(), 'data');
const WALLET_STORE_FILE = path.join(DATA_DIR, 'wallet_store.json');

export interface EnrichedLedgerTransaction extends LedgerTransaction {
  userId: string;
  userEmail: string;
}

export class WalletService {
  private balances = new Map<string, number>();
  private userEmails = new Map<string, string>();
  private ledgerRecords = new Map<string, LedgerTransaction[]>();

  constructor() {
    this.loadPersistedStore();
  }

  resetForTest() {
    this.balances.clear();
    this.ledgerRecords.clear();
    this.userEmails.clear();
  }

  private isTestRuntime(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.argv.some((a) => a.includes('test') || a.includes('vitest'))
    );
  }

  private loadPersistedStore() {
    if (this.isTestRuntime()) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(WALLET_STORE_FILE)) {
        const raw = fs.readFileSync(WALLET_STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.balances) {
          for (const [k, v] of Object.entries(parsed.balances)) {
            this.balances.set(k, Number(v));
          }
        }
        if (parsed.userEmails) {
          for (const [k, v] of Object.entries(parsed.userEmails)) {
            this.userEmails.set(k, String(v));
          }
        }
        if (parsed.ledgerRecords) {
          for (const [k, v] of Object.entries(parsed.ledgerRecords)) {
            const list = v as LedgerTransaction[];
            const seenRefs = new Set<string>();
            const deduped: LedgerTransaction[] = [];
            for (const tx of list) {
              if (tx.type === 'credit' && tx.category === 'deposit' && tx.reference) {
                if (seenRefs.has(tx.reference)) {
                  console.log(`[WALLET_STORE] Deduplicating legacy duplicate deposit: ${tx.reference}`);
                  continue;
                }
                seenRefs.add(tx.reference);
              }
              deduped.push(tx);
            }
            this.ledgerRecords.set(k, deduped);

            // Reconcile user balance if duplicate transactions were pruned
            if (deduped.length !== list.length) {
              let computedBal = 0;
              const chronological = [...deduped].reverse();
              for (const entry of chronological) {
                if (entry.type === 'credit') computedBal += entry.amountNgn;
                else if (entry.type === 'debit') computedBal -= entry.amountNgn;
              }
              this.balances.set(k, Math.max(0, computedBal));
              console.log(`[WALLET_STORE] Reconciled balance for ${k} to ₦${computedBal}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[WALLET_STORE] Load notice: ${err.message}`);
    }
  }

  private savePersistedStore() {
    if (this.isTestRuntime()) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const balancesObj: Record<string, number> = {};
      for (const [k, v] of this.balances.entries()) {
        balancesObj[k] = v;
      }
      const userEmailsObj: Record<string, string> = {};
      for (const [k, v] of this.userEmails.entries()) {
        userEmailsObj[k] = v;
      }
      const ledgerObj: Record<string, LedgerTransaction[]> = {};
      for (const [k, v] of this.ledgerRecords.entries()) {
        ledgerObj[k] = v;
      }
      fs.writeFileSync(
        WALLET_STORE_FILE,
        JSON.stringify(
          {
            balances: balancesObj,
            userEmails: userEmailsObj,
            ledgerRecords: ledgerObj,
            updatedAt: new Date().toISOString()
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err: any) {
      console.warn(`[WALLET_STORE] Save notice: ${err.message}`);
    }
  }

  recordUserEmail(userId: string, email: string) {
    if (userId && email) {
      const cleanEmail = email.toLowerCase().trim();
      this.userEmails.set(userId, cleanEmail);
      this.emailToUserMap.set(cleanEmail, userId);
      this.savePersistedStore();
    }
  }

  private emailToUserMap = new Map<string, string>();

  private resolveAccountKey(userId: string, email?: string): string {
    const cleanEmail = email?.toLowerCase().trim();
    if (cleanEmail && cleanEmail.includes('@')) {
      this.userEmails.set(userId, cleanEmail);
      this.emailToUserMap.set(cleanEmail, userId);
      if (this.balances.has(userId) && (this.balances.get(userId) || 0) > 0) return userId;
      if (this.balances.has(cleanEmail) && (this.balances.get(cleanEmail) || 0) > 0) return cleanEmail;
      for (const [uid, uemail] of this.userEmails.entries()) {
        if (uemail === cleanEmail && this.balances.has(uid) && (this.balances.get(uid) || 0) > 0) {
          return uid;
        }
      }
      return cleanEmail;
    }

    if (userId.includes('@')) {
      const e = userId.toLowerCase().trim();
      if (this.balances.has(e)) return e;
      for (const [uid, uemail] of this.userEmails.entries()) {
        if (uemail === e && this.balances.has(uid) && (this.balances.get(uid) || 0) > 0) return uid;
      }
      return e;
    }

    const mappedEmail = this.userEmails.get(userId);
    if (mappedEmail) {
      if (this.balances.has(userId) && (this.balances.get(userId) || 0) > 0) return userId;
      if (this.balances.has(mappedEmail) && (this.balances.get(mappedEmail) || 0) > 0) return mappedEmail;
      for (const [uid, uemail] of this.userEmails.entries()) {
        if (uemail === mappedEmail && this.balances.has(uid) && (this.balances.get(uid) || 0) > 0) {
          return uid;
        }
      }
    }

    return userId;
  }

  getBalance(userId: string, email?: string): number {
    const key = this.resolveAccountKey(userId, email);
    const bal = this.balances.get(key);
    if (typeof bal === 'number') return bal;
    const directBal = this.balances.get(userId);
    if (typeof directBal === 'number') return directBal;
    if (email) {
      const emailBal = this.balances.get(email.toLowerCase().trim());
      if (typeof emailBal === 'number') return emailBal;
    }
    return 0;
  }

  getLedger(userId: string, categoryFilter?: string, email?: string): LedgerTransaction[] {
    const key = this.resolveAccountKey(userId, email);
    let list = this.ledgerRecords.get(key);
    if (!list || list.length === 0) {
      list = this.ledgerRecords.get(userId);
    }
    if (!list || list.length === 0) {
      if (email) list = this.ledgerRecords.get(email.toLowerCase().trim());
    }
    const safeList = list || [];
    if (!categoryFilter || categoryFilter === 'all') return safeList;
    return safeList.filter(t => t.category === categoryFilter);
  }

  /**
   * Platform-Wide Global Ledger (All transactions across all users)
   */
  getAllTransactions(categoryFilter?: string): EnrichedLedgerTransaction[] {
    const all: EnrichedLedgerTransaction[] = [];
    for (const [userId, records] of this.ledgerRecords.entries()) {
      const email = this.userEmails.get(userId) || (userId.includes('@') ? userId : 'customer@ojalogs.com');
      for (const record of records) {
        if (!categoryFilter || categoryFilter === 'all' || record.category === categoryFilter) {
          all.push({
            ...record,
            userId,
            userEmail: email
          });
        }
      }
    }
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Platform-Wide Customer Deposits
   */
  getAllDeposits(): EnrichedLedgerTransaction[] {
    return this.getAllTransactions('deposit');
  }

  /**
   * Aggregated Financial Stats
   */
  getGlobalStats() {
    let totalDepositsNgn = 0;
    let totalPurchasesNgn = 0;
    let totalWalletLiabilitiesNgn = 0;
    let depositCount = 0;
    let orderCount = 0;

    for (const [_, bal] of this.balances.entries()) {
      totalWalletLiabilitiesNgn += bal;
    }

    for (const [_, records] of this.ledgerRecords.entries()) {
      for (const r of records) {
        if (r.category === 'deposit') {
          totalDepositsNgn += r.amountNgn;
          depositCount++;
        } else if (r.type === 'debit') {
          totalPurchasesNgn += r.amountNgn;
          orderCount++;
        }
      }
    }

    return {
      totalDepositsNgn,
      totalPurchasesNgn,
      totalWalletLiabilitiesNgn,
      depositCount,
      orderCount
    };
  }

  creditWallet(
    userId: string,
    amount: number,
    category: LedgerCategory,
    reference: string,
    description: string,
    idempotencyKey?: string,
    userEmail?: string
  ): LedgerTransaction {
    if (amount <= 0) {
      throw new AppError('Credit amount must be greater than zero', 400, 'INVALID_AMOUNT');
    }

    const cleanEmail = userEmail?.toLowerCase().trim() || this.userEmails.get(userId);
    if (cleanEmail) {
      this.userEmails.set(userId, cleanEmail);
      this.emailToUserMap.set(cleanEmail, userId);
    }

    // Strict idempotency: prevent concurrent or repeated double-credit for same reference or key
    const userLedger = this.getLedger(userId, 'all', cleanEmail);
    const existingTx = userLedger.find(
      tx =>
        (reference && tx.reference === reference && tx.type === 'credit') ||
        (idempotencyKey && tx.idempotencyKey === idempotencyKey && tx.type === 'credit')
    );

    if (existingTx) {
      console.log(`[WALLET_IDEMPOTENCY] Transaction already credited for reference "${reference}" / key "${idempotencyKey}". Re-using existing ledger tx ${existingTx.id}.`);
      return existingTx;
    }

    const currentBalance = this.getBalance(userId, cleanEmail);
    const newBalance = currentBalance + amount;
    this.balances.set(userId, newBalance);
    if (cleanEmail) {
      this.balances.set(cleanEmail, newBalance);
    }

    const tx: LedgerTransaction = {
      id: `ldg_${Date.now()}`,
      reference,
      type: 'credit',
      category,
      amountNgn: amount,
      balanceAfterNgn: newBalance,
      description,
      status: 'successful',
      timestamp: new Date().toISOString(),
      idempotencyKey
    };

    const updatedLedger = [tx, ...userLedger];
    this.ledgerRecords.set(userId, updatedLedger);
    if (cleanEmail) {
      this.ledgerRecords.set(cleanEmail, updatedLedger);
    }
    this.savePersistedStore();
    return tx;
  }

  debitWallet(
    userId: string,
    amount: number,
    category: LedgerCategory,
    reference: string,
    description: string,
    idempotencyKey?: string,
    relatedOrderReference?: string,
    userEmail?: string
  ): LedgerTransaction {
    if (amount <= 0) {
      throw new AppError('Debit amount must be greater than zero', 400, 'INVALID_AMOUNT');
    }

    const cleanEmail = userEmail?.toLowerCase().trim() || this.userEmails.get(userId);
    const currentBalance = this.getBalance(userId, cleanEmail);
    if (currentBalance < amount) {
      throw new AppError(
        `Insufficient wallet balance. Required: ₦${amount.toLocaleString()}, Available: ₦${currentBalance.toLocaleString()}`,
        400,
        'INSUFFICIENT_FUNDS'
      );
    }

    const newBalance = currentBalance - amount;
    this.balances.set(userId, newBalance);
    if (cleanEmail) {
      this.balances.set(cleanEmail, newBalance);
    }

    const tx: LedgerTransaction = {
      id: `ldg_${Date.now()}`,
      reference,
      type: 'debit',
      category,
      amountNgn: amount,
      balanceAfterNgn: newBalance,
      description,
      status: 'successful',
      timestamp: new Date().toISOString(),
      idempotencyKey,
      relatedOrderReference
    };

    const userLedger = this.getLedger(userId, 'all', cleanEmail);
    const updatedLedger = [tx, ...userLedger];
    this.ledgerRecords.set(userId, updatedLedger);
    if (cleanEmail) {
      this.ledgerRecords.set(cleanEmail, updatedLedger);
    }
    this.savePersistedStore();
    return tx;
  }

  async initiateFunding(userId: string, amount: number, customerEmail: string, idempotencyKey: string) {
    if (customerEmail) {
      this.userEmails.set(userId, customerEmail.toLowerCase().trim());
      this.savePersistedStore();
    }
    const reference = `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`;
    const gatewayRes = await bachGateway.initializePayment({
      userId,
      amountNgn: amount,
      customerEmail,
      reference,
      metadata: { idempotencyKey }
    });

    return {
      reference,
      amountNgn: amount,
      currency: 'NGN',
      gateway: 'bach',
      gatewayReference: gatewayRes.gatewayReference,
      checkoutUrl: gatewayRes.checkoutUrl,
      dynamicAccountDetails: gatewayRes.dynamicAccountDetails
    };
  }

  async verifyAndCredit(userId: string, paymentReference: string, gatewayReference: string) {
    const userLedger = this.ledgerRecords.get(userId) || [];
    const existingTx = userLedger.find(
      t => t.reference === paymentReference && t.type === 'credit'
    );
    if (existingTx) {
      return {
        verified: true,
        creditedAmount: existingTx.amountNgn,
        newBalance: this.getBalance(userId),
        transaction: existingTx
      };
    }

    const verified = await bachGateway.verifyPayment(gatewayReference);
    if (verified.status !== 'successful') {
      throw new AppError('Payment not yet confirmed by gateway.', 400, 'PAYMENT_PENDING');
    }

    const tx = this.creditWallet(
      userId,
      verified.amountNgn,
      'deposit',
      paymentReference,
      `Wallet top-up via BACH Gateway (${paymentReference})`
    );

    return {
      verified: true,
      creditedAmount: verified.amountNgn,
      newBalance: tx.balanceAfterNgn,
      transaction: tx
    };
  }
}

export const walletService = new WalletService();
