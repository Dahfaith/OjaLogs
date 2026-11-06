import { AppError } from '../middleware/errorHandler.js';
import { LedgerTransaction, LedgerCategory, LedgerEntryType } from '@ojalogs/shared';
import { bachGateway } from '../gateways/bach.gateway.js';

// In-Memory state for serverless execution / testing
export class WalletService {
  private balances = new Map<string, number>();

  private ledgerRecords = new Map<string, LedgerTransaction[]>();

  getBalance(userId: string): number {
    return this.balances.get(userId) || 0;
  }

  getLedger(userId: string, categoryFilter?: string): LedgerTransaction[] {
    const list = this.ledgerRecords.get(userId) || [];
    if (!categoryFilter || categoryFilter === 'all') return list;
    return list.filter(t => t.category === categoryFilter);
  }

  creditWallet(
    userId: string,
    amount: number,
    category: LedgerCategory,
    reference: string,
    description: string,
    idempotencyKey?: string
  ): LedgerTransaction {
    if (amount <= 0) {
      throw new AppError('Credit amount must be greater than zero', 400, 'INVALID_AMOUNT');
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
    return tx;
  }

  async initiateFunding(userId: string, amount: number, customerEmail: string, idempotencyKey: string) {
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
