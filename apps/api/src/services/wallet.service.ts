import fs from 'node:fs';
import path from 'node:path';
import { AppError } from '../middleware/errorHandler.js';
import { LedgerTransaction, LedgerCategory, LedgerEntryType } from '@ojalogs/shared';
import { bachGateway } from '../gateways/bach.gateway.js';

const DATA_DIR = path.join(process.cwd(), 'data');
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

  private loadPersistedStore() {
    if (process.env.NODE_ENV === 'test') return;
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
            this.ledgerRecords.set(k, v as LedgerTransaction[]);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[WALLET_STORE] Load notice: ${err.message}`);
    }
  }

  private savePersistedStore() {
    if (process.env.NODE_ENV === 'test') return;
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
    if (userId && email && !this.userEmails.has(userId)) {
      this.userEmails.set(userId, email.toLowerCase().trim());
      this.savePersistedStore();
    }
  }

  getBalance(userId: string): number {
    return this.balances.get(userId) || 0;
  }

  getLedger(userId: string, categoryFilter?: string): LedgerTransaction[] {
    const list = this.ledgerRecords.get(userId) || [];
    if (!categoryFilter || categoryFilter === 'all') return list;
    return list.filter(t => t.category === categoryFilter);
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

    if (userEmail) {
      this.userEmails.set(userId, userEmail.toLowerCase().trim());
    }

    const currentBalance = this.getBalance(userId);
    const newBalance = currentBalance + amount;
    this.balances.set(userId, newBalance);

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

    const userLedger = this.ledgerRecords.get(userId) || [];
    this.ledgerRecords.set(userId, [tx, ...userLedger]);
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
    relatedOrderReference?: string
  ): LedgerTransaction {
    if (amount <= 0) {
      throw new AppError('Debit amount must be greater than zero', 400, 'INVALID_AMOUNT');
    }

    const currentBalance = this.getBalance(userId);
    if (currentBalance < amount) {
      throw new AppError(
        `Insufficient wallet balance. Required: ₦${amount.toLocaleString()}, Available: ₦${currentBalance.toLocaleString()}`,
        400,
        'INSUFFICIENT_FUNDS'
      );
    }

    const newBalance = currentBalance - amount;
    this.balances.set(userId, newBalance);

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

    const userLedger = this.ledgerRecords.get(userId) || [];
    this.ledgerRecords.set(userId, [tx, ...userLedger]);
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
