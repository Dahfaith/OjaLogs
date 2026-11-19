process.env.NODE_ENV = 'test';
process.env.TEST_SUPPLIER_DISPATCH = 'true';

import { orderService } from '../src/services/order.service.js';
import { walletService } from '../src/services/wallet.service.js';
import { logspollAdapter } from '../src/adapters/logspoll/logspoll.adapter.js';
import { smmService } from '../src/services/smm.service.js';
import { linkocialAdapter } from '../src/adapters/smm/linkocial.adapter.js';

console.log('\n======================================================');
console.log('🛡️ RUNNING AUTOMATED REFUND SAFETY & INTEGRITY TEST SUITE');
console.log('======================================================\n');

async function runTests() {
  let passedCount = 0;
  let testNum = 0;

  const assert = (condition: boolean, msg: string) => {
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`✅ PASS: ${msg}`);
    passedCount++;
  };

  const originalOrderProduct = logspollAdapter.orderProduct.bind(logspollAdapter);
  const originalPlaceOrder = linkocialAdapter.placeOrder.bind(linkocialAdapter);

  // Setup test user
  const testUserId = `usr_test_safe_${Date.now()}`;
  const testUserEmail = 'safety_tester@ojalogs.com';

  // Fund test wallet with ₦100,000
  walletService.creditWallet(
    testUserId,
    100000,
    'deposit',
    `ref_dep_init_${Date.now()}`,
    'Initial test funding',
    undefined,
    testUserEmail
  );

  let balanceBefore = walletService.getBalance(testUserId, testUserEmail);
  assert(balanceBefore === 100000, 'Initial wallet funded to ₦100,000');

  // =========================================================================
  // SCENARIO 1: Supplier returns immediate success -> completed, no refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Supplier Instant Success ---`);
  logspollAdapter.orderProduct = async (productId, quantity, idempotencyKey) => ({
    success: true,
    status: 'completed',
    orderId: 'lp_ord_1001',
    reference: 'LP-1001',
    secretKey: 'user123:pass456:2fa789',
    deliveryFormat: 'Username:Password:2FA Key',
    instructions: 'Mocked live instant delivery'
  });

  const order1 = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_instant', title: 'Instant Account', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 500 }],
    'wallet',
    `idemp_s1_${Date.now()}`
  );

  assert(order1.status === 'completed', 'Order 1 is completed');
  assert(order1.items[0].deliveredSecrets[0].type === 'license_key', 'Delivered credentials stored in vault');
  assert(walletService.getBalance(testUserId, testUserEmail) === 99500, 'Wallet debited exactly ₦500');

  // =========================================================================
  // SCENARIO 2: Supplier returns fulfillment_pending -> processing, NO refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Supplier Pending / Extraction Delay ---`);
  logspollAdapter.orderProduct = async (productId, quantity, idempotencyKey) => ({
    success: false,
    status: 'fulfillment_pending',
    orderId: 'lp_ord_pending_2002',
    reference: 'LP-2002',
    error: 'Upstream order accepted but digital credentials are pending extraction'
  });

  const order2 = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_pending', title: 'Pending Account', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 328 }],
    'wallet',
    `idemp_s2_${Date.now()}`
  );

  assert(order2.status === 'processing', 'Order 2 remains in processing status');
  assert(order2.fulfillmentStatus === 'reconciliation_required', 'Order 2 flagged for reconciliation');
  assert(order2.items[0].deliveredSecrets[0].value === 'PENDING_DISPATCH', 'Pending dispatch placeholder stored');
  assert(walletService.getBalance(testUserId, testUserEmail) === 99172, 'Customer charged ₦328, ZERO auto-refund');

  // =========================================================================
  // SCENARIO 3: Supplier API timeout / network error -> processing, NO refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Supplier Timeout / Network Ambiguity ---`);
  logspollAdapter.orderProduct = async () => ({
    success: false,
    status: 'network_error',
    error: 'Connection timed out after 30000ms'
  });

  const order3 = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_timeout', title: 'Timeout Account', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 328 }],
    'wallet',
    `idemp_s3_${Date.now()}`
  );

  assert(order3.status === 'processing', 'Order 3 remains in processing status on timeout');
  assert(order3.fulfillmentStatus === 'reconciliation_required', 'Order 3 flagged for reconciliation');
  assert(walletService.getBalance(testUserId, testUserEmail) === 98844, 'Customer charged ₦328, ZERO auto-refund');

  // =========================================================================
  // SCENARIO 4: Supplier reports restocking -> processing, NO refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Supplier Restocking Notice ---`);
  logspollAdapter.orderProduct = async () => ({
    success: false,
    status: 'rejected',
    error: 'Upstream Restocking: Cluster node currently replenishing'
  });

  const order4 = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_restock', title: 'Restocking Account', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 328 }],
    'wallet',
    `idemp_s4_${Date.now()}`
  );

  assert(order4.status === 'processing', 'Order 4 remains in processing status on restocking');
  assert(order4.fulfillmentStatus === 'reconciliation_required', 'Order 4 flagged for reconciliation');
  assert(walletService.getBalance(testUserId, testUserEmail) === 98516, 'Customer charged ₦328, ZERO auto-refund');

  // =========================================================================
  // SCENARIO 5: Supplier failure / rejection -> processing, NO refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Supplier Upstream Failure ---`);
  logspollAdapter.orderProduct = async () => {
    throw new Error('Internal Server Error (500) from supplier');
  };

  const order5 = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_err', title: 'Error Account', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 328 }],
    'wallet',
    `idemp_s5_${Date.now()}`
  );

  assert(order5.status === 'processing', 'Order 5 remains in processing status on exception');
  assert(order5.fulfillmentStatus === 'reconciliation_required', 'Order 5 flagged for reconciliation');
  assert(walletService.getBalance(testUserId, testUserEmail) === 98188, 'Customer charged ₦328, ZERO auto-refund');

  // =========================================================================
  // SCENARIO 6: Repeated checkout with idempotency key -> Idempotent, no duplicates
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Idempotency Protection ---`);
  let supplierCallCount = 0;
  logspollAdapter.orderProduct = async () => {
    supplierCallCount++;
    return {
      success: true,
      status: 'completed',
      secretKey: 'key_idemp_1',
      deliveryFormat: 'Code',
      instructions: 'Done'
    };
  };

  const idempKey = `test_idemp_unique_${Date.now()}`;
  const firstAttempt = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_idemp', title: 'Idemp Item', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 200 }],
    'wallet',
    idempKey
  );

  const balanceAfterFirst = walletService.getBalance(testUserId, testUserEmail);

  // Second attempt with exact same idempotency key
  const secondAttempt = await orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_idemp', title: 'Idemp Item', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 200 }],
    'wallet',
    idempKey
  );

  assert(firstAttempt.id === secondAttempt.id, 'Both attempts returned the identical order ID');
  assert(supplierCallCount === 1, 'Supplier was contacted exactly once');
  assert(walletService.getBalance(testUserId, testUserEmail) === balanceAfterFirst, 'Customer wallet was NOT debited twice');

  // =========================================================================
  // SCENARIO 7: Concurrency lock prevents simultaneous duplicate requests
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Concurrency In-Flight Lock ---`);
  let slowRelease: () => void;
  const slowPromise = new Promise<void>(res => { slowRelease = res; });

  logspollAdapter.orderProduct = async () => {
    await slowPromise;
    return { success: true, status: 'completed', secretKey: 'slow_key', deliveryFormat: 'Code', instructions: 'Ok' };
  };

  const concurrentKey = `concurrent_${Date.now()}`;
  const req1 = orderService.checkout(
    testUserId,
    testUserEmail,
    [{ productId: 'lp_test_concurrent', title: 'Concurrent Item', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 150 }],
    'wallet',
    concurrentKey
  );

  let concurrentBlocked = false;
  try {
    await orderService.checkout(
      testUserId,
      testUserEmail,
      [{ productId: 'lp_test_concurrent', title: 'Concurrent Item', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 150 }],
      'wallet',
      concurrentKey
    );
  } catch (err: any) {
    if (err.statusCode === 409) concurrentBlocked = true;
  }

  slowRelease!();
  await req1;
  assert(concurrentBlocked, 'Concurrent checkout with same key blocked with 409 ORDER_IN_PROGRESS');

  // =========================================================================
  // SCENARIO 8: Out-of-Stock detected pre-checkout -> wallet untouched, no refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Pre-Checkout Out of Stock ---`);
  const balBeforeOos = walletService.getBalance(testUserId, testUserEmail);
  let oosBlocked = false;
  try {
    await orderService.checkout(
      testUserId,
      testUserEmail,
      [{ productId: 'lp_f2990331-7691-4e2c-aeb5-354d0256a6de', title: 'Instagram Account Out of Stock', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 644 }],
      'wallet',
      `idemp_oos_${Date.now()}`
    );
  } catch (err: any) {
    if (err.statusCode === 400 || err.code === 'OUT_OF_STOCK') oosBlocked = true;
  }
  assert(oosBlocked, 'Out-of-stock product blocked before debit');
  assert(walletService.getBalance(testUserId, testUserEmail) === balBeforeOos, 'Wallet balance remained completely untouched');

  // =========================================================================
  // SCENARIO 9: Insufficient balance pre-checkout -> wallet untouched, no refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Pre-Checkout Insufficient Balance ---`);
  const poorUserId = `usr_poor_${Date.now()}`;
  let poorBlocked = false;
  try {
    await orderService.checkout(
      poorUserId,
      'poor@test.com',
      [{ productId: 'prod_expensive', title: 'Expensive', serverCluster: 'Server 2', quantity: 1, unitPriceNgn: 500000 }],
      'wallet',
      `idemp_poor_${Date.now()}`
    );
  } catch (err: any) {
    if (err.statusCode === 400 && err.code === 'INSUFFICIENT_FUNDS') poorBlocked = true;
  }
  assert(poorBlocked, 'Insufficient funds blocked pre-checkout');
  assert(walletService.getBalance(poorUserId) === 0, 'Zero-balance user untouched');

  // =========================================================================
  // SCENARIO 10: Server Cluster Mismatch pre-checkout -> wallet untouched, no refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Pre-Checkout Cluster Mismatch Guard ---`);
  const balBeforeMismatch = walletService.getBalance(testUserId, testUserEmail);
  let mismatchBlocked = false;
  try {
    await orderService.checkout(
      testUserId,
      testUserEmail,
      [{ productId: 'prod_mismatch', title: 'Facebook 2FA Account', serverCluster: 'Server 1', quantity: 1, unitPriceNgn: 300 }],
      'wallet',
      `idemp_mis_${Date.now()}`
    );
  } catch (err: any) {
    if (err.statusCode === 503 && err.code === 'SERVER_RESTOCKING') mismatchBlocked = true;
  }
  assert(mismatchBlocked, 'Server 1 social account cluster mismatch blocked safely pre-checkout');
  assert(walletService.getBalance(testUserId, testUserEmail) === balBeforeMismatch, 'Wallet balance untouched');

  // =========================================================================
  // SCENARIO 11: Authorized Admin Manual Refund -> succeeds, audit details saved
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Authorized Administrator Manual Refund ---`);
  const balBeforeManualRf = walletService.getBalance(testUserId, testUserEmail);
  // Refund order 2 (which is in processing)
  const refundedOrder = orderService.refundOrder(
    order2.id,
    'Verified supplier did not deliver credentials after 24h',
    'admin@ojalogs.com.ng'
  );

  assert(refundedOrder.status === 'refunded', 'Order 2 status transitioned to refunded');
  assert((refundedOrder as any).refundDetails?.refundedBy === 'admin@ojalogs.com.ng', 'Admin email recorded in audit');
  assert(walletService.getBalance(testUserId, testUserEmail) === balBeforeManualRf + 328, 'Customer wallet credited exactly ₦328');

  // =========================================================================
  // SCENARIO 12: Calling Manual Refund twice -> Idempotent, does not credit twice
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Idempotent Manual Refund ---`);
  const balAfterFirstRf = walletService.getBalance(testUserId, testUserEmail);
  orderService.refundOrder(order2.id, 'Duplicate refund attempt', 'admin@ojalogs.com.ng');
  assert(walletService.getBalance(testUserId, testUserEmail) === balAfterFirstRf, 'Double refund prevented; wallet not credited again');

  // =========================================================================
  // SCENARIO 13: SMM Boost Order Provider Rejection -> in_progress, NO auto-refund
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: SMM Upstream Failure / Network Ambiguity ---`);
  linkocialAdapter.placeOrder = async () => ({
    error: 'Linkocial API: Provider balance low or maintenance'
  });

  const balBeforeSmm = walletService.getBalance(testUserId, testUserEmail);
  const smmTargetService = smmService.getPublicServices()[0] || smmService.getServiceById('smm_tiktok_203') || smmService.getServiceById('smm_twitter_1599')!;
  const smmOrder = await smmService.placeOrder(
    testUserId,
    testUserEmail,
    smmTargetService.id,
    'https://instagram.com/p/testlink',
    smmTargetService.minQuantity || 50,
    `idemp_smm_${Date.now()}`
  );

  assert(smmOrder.status === 'in_progress', 'SMM Order held in progress');
  assert(smmOrder.reconciliationRequired === true, 'SMM Order flagged for reconciliation');
  assert(walletService.getBalance(testUserId, testUserEmail) < balBeforeSmm, 'Customer charged, ZERO auto-refund');

  // =========================================================================
  // SCENARIO 14: Global Ledger Audit: Zero Unauthorized Auto-Refunds
  // =========================================================================
  testNum++;
  console.log(`\n--- SCENARIO ${testNum}: Global Ledger Verification: Zero Auto-Refunds ---`);
  const ledger = walletService.getLedger(testUserId);
  const autoRefunds = ledger.filter(
    tx => tx.category === 'refund' && (tx.description?.toLowerCase().includes('auto-refund') || tx.description?.toLowerCase().includes('restocking'))
  );
  assert(autoRefunds.length === 0, `Zero auto-refunds in ledger (Found: ${autoRefunds.length})`);

  // Restore mocks
  logspollAdapter.orderProduct = originalOrderProduct;
  linkocialAdapter.placeOrder = originalPlaceOrder;

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedCount} VERIFICATION CHECKS PASSED WITH ZERO LOSSES!`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILURE:', err);
  process.exit(1);
});
