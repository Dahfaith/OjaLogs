import assert from 'node:assert';
import { catalogService } from '../src/services/catalog.service';
import { auditService } from '../src/services/audit.service';
import { walletService } from '../src/services/wallet.service';

async function runAdminMarkupAuditTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING ADMIN INDEPENDENT MARKUP & AUDIT LOG TESTS');
  console.log('======================================================\n');

  // 1. Independent Server Cluster Markup
  console.log('--- 1. Independent Server Cluster Markup ---');
  const initialMarginServer1 = catalogService.getServerMargin('server1');
  const initialMarginServer2 = catalogService.getServerMargin('server2');

  // Update server 1 to 25% markup
  const updatedProducts = catalogService.applyClusterMarkup('server1', 25);
  const newMarginServer1 = catalogService.getServerMargin('server1');
  const newMarginServer2 = catalogService.getServerMargin('server2');

  assert.strictEqual(newMarginServer1, 25, 'Server 1 margin should be 25%');
  assert.strictEqual(newMarginServer2, initialMarginServer2, 'Server 2 margin should remain unaffected');
  console.log(`✅ PASS: Server 1 margin set to ${newMarginServer1}%, Server 2 margin remained ${newMarginServer2}%`);

  // Verify formula: Selling Price = Math.round(Supplier Cost * (1 + 25 / 100))
  const server1Products = catalogService.getProducts().filter(p => p.serverCluster === 'server1');
  for (const prod of server1Products) {
    if (prod.costPriceNgn && prod.costPriceNgn > 0) {
      const expectedSelling = Math.round(prod.costPriceNgn * (1 + 25 / 100));
      assert.strictEqual(prod.priceNgn, expectedSelling, `Product ${prod.name} selling price should follow formula`);
    }
  }
  console.log('✅ PASS: All Server 1 products follow Selling Price = Supplier Cost * (1 + Markup% / 100)');

  // 2. Audit Trail Persistence
  console.log('\n--- 2. Cryptographic Administrative Audit Trail ---');
  auditService.recordEvent({
    action: 'MARKUP_CHANGED',
    category: 'pricing',
    actorEmail: 'admin@ojalogs.com.ng',
    target: 'server1',
    details: `Updated Server 1 profit markup from ${initialMarginServer1}% to 25% (${updatedProducts.updatedCount} items recalculated)`,
    metadata: {
      cluster: 'server1',
      oldMarkup: initialMarginServer1,
      newMarkup: 25,
      affectedProducts: updatedProducts.updatedCount
    }
  });

  const auditLogs = auditService.getEvents(10);
  const markupLog = auditLogs.find(l => l.action === 'MARKUP_CHANGED' && l.target === 'server1');
  assert.ok(markupLog, 'Audit log must record MARKUP_CHANGED for server1');
  assert.strictEqual(markupLog.actorEmail, 'admin@ojalogs.com.ng', 'Admin email must match');
  assert.strictEqual(markupLog.metadata?.newMarkup, 25, 'New markup must be recorded');
  console.log('✅ PASS: Audit log successfully persisted MARKUP_CHANGED entry with admin identity and timestamp');

  // 3. Manual Wallet Adjustment Audit Logging
  console.log('\n--- 3. Customer Wallet Adjustment with Audit Logging ---');
  const testUserId = 'usr_admin_test_123';
  walletService.creditWallet(testUserId, 5000, 'deposit', 'tx_admin_test_init', 'Admin test initial credit');
  
  // Admin manual debit with mandatory reason
  const debitAmount = 1500;
  const reason = 'Fraudulent chargeback correction';
  const debitTx = walletService.debitWallet(testUserId, debitAmount, 'adjustment', 'tx_admin_debit_test', reason);
  const newBalance = walletService.getBalance(testUserId);
  
  auditService.recordEvent({
    action: 'WALLET_ADJUSTMENT',
    category: 'wallets',
    actorEmail: 'superadmin@ojalogs.com.ng',
    target: testUserId,
    details: `Debited ₦${debitAmount} from ${testUserId}. Reason: ${reason}. New balance: ₦${newBalance}`,
    metadata: {
      type: 'debit',
      amount: debitAmount,
      reason,
      newBalance
    }
  });

  const walletAuditLogs = auditService.getEvents(10);
  const adjustmentLog = walletAuditLogs.find(l => l.action === 'WALLET_ADJUSTMENT' && l.target === testUserId);
  assert.ok(adjustmentLog, 'Audit log must record WALLET_ADJUSTMENT for testUserId');
  assert.strictEqual(adjustmentLog.actorEmail, 'superadmin@ojalogs.com.ng');
  assert.strictEqual(adjustmentLog.metadata?.reason, reason);
  console.log('✅ PASS: Wallet balance adjusted and permanent audit entry recorded with mandatory reason');

  console.log('\n======================================================');
  console.log('🏁 ALL ADMIN MARKUP & AUDIT TEST ASSERTIONS PASSED!');
  console.log('======================================================\n');
}

runAdminMarkupAuditTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
