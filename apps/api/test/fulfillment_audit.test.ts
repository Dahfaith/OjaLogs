process.env.NODE_ENV = 'test';

import { orderService, validateFulfillmentSecret } from '../src/services/order.service.js';
import { walletService } from '../src/services/wallet.service.js';
import { catalogService } from '../src/services/catalog.service.js';
import { logspollAdapter } from '../src/adapters/logspoll/logspoll.adapter.js';
import { notificationService } from '../src/services/notification.service.js';
import { decryptPayload } from '../src/utils/crypto.js';

console.log('\n======================================================');
console.log('🧪 RUNNING PHASE 8: FULFILLMENT & INTEGRITY AUDIT SUITE');
console.log('======================================================\n');

async function runAuditTests() {
  let passedCount = 0;
  const assert = (condition: boolean, msg: string) => {
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`✅ PASS: ${msg}`);
    passedCount++;
  };

  // Setup test customer wallets
  const userA = 'usr_audit_cust_a';
  const userAEmail = 'cust_a@ojalogs.com';
  const userB = 'usr_audit_cust_b';
  const userBEmail = 'cust_b@ojalogs.com';

  walletService.creditWallet(userA, 100000, 'deposit', `ref_dep_a_${Date.now()}`, 'Audit initial balance A', undefined, userAEmail);
  walletService.creditWallet(userB, 100000, 'deposit', `ref_dep_b_${Date.now()}`, 'Audit initial balance B', undefined, userBEmail);

  // ---------------------------------------------------------
  // TEST 1: Customer purchases Facebook account. Correct Facebook fulfillment attached.
  // ---------------------------------------------------------
  console.log('\n--- TEST 1: Facebook Account Purchase & Correct Fulfillment ---');
  const fbOrder = await orderService.checkout(
    userA,
    userAEmail,
    [
      {
        productId: 'lp_fb_audit_sku_01',
        serverCluster: 'Server 2',
        title: '1 YEAR OLD 2FA FACEBOOK ACCOUNTS, MIX IP',
        quantity: 1,
        unitPriceNgn: 284
      }
    ],
    'wallet',
    `idemp_test1_${Date.now()}`
  );

  assert(fbOrder.status === 'completed', 'Facebook order marked completed');
  assert(fbOrder.items.length === 1, 'Order has exactly 1 item');
  assert(fbOrder.items[0].product.title.includes('FACEBOOK'), 'Item title preserved as Facebook');
  
  // Reveal and inspect credentials
  const fbSecret = orderService.revealSecret(userA, fbOrder.id, fbOrder.items[0].id);
  assert(Boolean(fbSecret.secret), 'Secret key revealed successfully');
  assert(!fbSecret.secret.startsWith('NORD-PRO'), 'Delivered secret is NOT a NordVPN voucher key');
  assert(fbSecret.secret.includes(':') || /^\d{6,}/.test(fbSecret.secret), 'Delivered secret contains valid account credentials (UID/Pass/2FA)');

  // ---------------------------------------------------------
  // TEST 2: Customer purchases Twitter/X account. Correct Twitter/X fulfillment attached.
  // ---------------------------------------------------------
  console.log('\n--- TEST 2: Twitter/X Account Purchase & Correct Fulfillment ---');
  const twOrder = await orderService.checkout(
    userB,
    userBEmail,
    [
      {
        productId: 'lp_tw_audit_sku_02',
        serverCluster: 'Server 2',
        title: '1 year old Twitter X accounts with high quality recovery mail included',
        quantity: 1,
        unitPriceNgn: 450
      }
    ],
    'wallet',
    `idemp_test2_${Date.now()}`
  );

  assert(twOrder.status === 'completed', 'Twitter order marked completed');
  assert(twOrder.items[0].product.title.includes('Twitter'), 'Item title preserved as Twitter');
  const twSecret = orderService.revealSecret(userB, twOrder.id, twOrder.items[0].id);
  assert(!twSecret.secret.startsWith('NORD-PRO'), 'Twitter fulfillment does NOT receive NordVPN key');
  assert(twSecret.secret.includes('@') || twSecret.secret.includes(':'), 'Twitter fulfillment contains valid user/email/2FA credentials');

  // ---------------------------------------------------------
  // TEST 3: LogsPoll returns a license-key-shaped response for an account product.
  // System flags the mismatch and blocks fulfillment.
  // ---------------------------------------------------------
  console.log('\n--- TEST 3: Credential Shape Mismatch Detection ---');
  const mismatchItem = {
    title: '1 YEAR OLD 2FA FACEBOOK ACCOUNTS, MIX IP',
    productId: 'lp_test_mismatch',
    serverCluster: 'Server 2'
  };

  const badNordKey = 'NORD-PRO-2026-EUYO-3H1I';
  const validation1 = validateFulfillmentSecret(mismatchItem, badNordKey);
  assert(!validation1.valid, 'NordVPN voucher for Facebook account correctly rejected by validation guard');
  assert(Boolean(validation1.reason?.includes('FULFILLMENT_MISMATCH')), 'Validation error clearly flags FULFILLMENT_MISMATCH');

  const goodFbKey = '61595830650391:SecretPass123!:K4J9H2P0L8M7';
  const validation2 = validateFulfillmentSecret(mismatchItem, goodFbKey);
  assert(validation2.valid, 'Legitimate Facebook UID:Password:2FA secret correctly accepted');

  // ---------------------------------------------------------
  // TEST 4: Two customers purchase different products simultaneously.
  // No cross-order credential leakage occurs.
  // ---------------------------------------------------------
  console.log('\n--- TEST 4: Multi-User Concurrent Isolation (No Data Leakage) ---');
  const [orderCustA, orderCustB] = await Promise.all([
    orderService.checkout(
      userA,
      userAEmail,
      [{ productId: 'lp_simul_a', serverCluster: 'Server 2', title: 'Instagram Aged Creator Profile', quantity: 1, unitPriceNgn: 500 }],
      'wallet',
      `idemp_simul_a_${Date.now()}`
    ),
    orderService.checkout(
      userB,
      userBEmail,
      [{ productId: 'lp_simul_b', serverCluster: 'Server 2', title: 'TikTok 1k+ Followers Account', quantity: 1, unitPriceNgn: 700 }],
      'wallet',
      `idemp_simul_b_${Date.now()}`
    )
  ]);

  const secretCustA = orderService.revealSecret(userA, orderCustA.id, orderCustA.items[0].id);
  const secretCustB = orderService.revealSecret(userB, orderCustB.id, orderCustB.items[0].id);

  assert(orderCustA.id !== orderCustB.id, 'Distinct order IDs generated');
  assert(orderCustA.customerEmail === userAEmail, 'Order A strictly bound to Customer A');
  assert(orderCustB.customerEmail === userBEmail, 'Order B strictly bound to Customer B');
  assert(secretCustA.secret !== secretCustB.secret, 'Secrets are distinct and isolated between customers');

  // ---------------------------------------------------------
  // TEST 5: Products with identical or similar titles but different IDs.
  // Disambiguated by authoritative product ID.
  // ---------------------------------------------------------
  console.log('\n--- TEST 5: Product Disambiguation by Authoritative SKU ---');
  const p1 = await catalogService.getProductByIdOrSlugAsync('prod_vpn_01');
  const p2 = await catalogService.getProductByIdOrSlugAsync('prod_vpn_02');
  assert(p1.id !== p2.id, 'Similar products retain distinct canonical internal IDs');
  assert(p1.slug !== p2.slug, 'Product slugs are distinct');
  assert(p1.title !== p2.title, 'Product titles are distinct');

  // ---------------------------------------------------------
  // TEST 6: Upstream provider error/timeout.
  // Customer not charged or auto-refunded, admin alert triggered, no fake secrets delivered.
  // ---------------------------------------------------------
  console.log('\n--- TEST 6: Upstream Failure Safety & Auto-Refund ---');
  const balBefore = walletService.getBalance(userA);
  let failedAsExpected = false;

  try {
    // Attempt purchase of a SKU that simulates upstream rejection
    await orderService.checkout(
      userA,
      userAEmail,
      [
        {
          productId: 'lp_reject_simulation_sku',
          serverCluster: 'Server 1', // Server 1 rejects social accounts with SERVER_CLUSTER_MISMATCH
          title: 'Facebook Fake SKU on Wrong Server',
          quantity: 1,
          unitPriceNgn: 5000
        }
      ],
      'wallet',
      `idemp_fail_${Date.now()}`
    );
  } catch (err: any) {
    failedAsExpected = true;
    assert(Boolean(err.message), `Expected error caught: ${err.message}`);
  }

  assert(failedAsExpected, 'Failed provisioning threw error and halted order creation');
  const balAfter = walletService.getBalance(userA);
  assert(balBefore === balAfter, `Wallet balance perfectly preserved after failed checkout (Balance: ₦${balAfter})`);

  // ---------------------------------------------------------
  // TEST 7: Order retry or webhook replay. Idempotency enforced.
  // ---------------------------------------------------------
  console.log('\n--- TEST 7: Checkout & Webhook Idempotency ---');
  const stableIdempKey = `idemp_stable_${Date.now()}`;
  const firstAttempt = await orderService.checkout(
    userA,
    userAEmail,
    [{ productId: 'lp_idemp_sku', serverCluster: 'Server 2', title: 'Twitter Verified Profile', quantity: 1, unitPriceNgn: 300 }],
    'wallet',
    stableIdempKey
  );

  const balAfterFirst = walletService.getBalance(userA);

  // Replay exactly same request with identical idempotencyKey
  const secondAttempt = await orderService.checkout(
    userA,
    userAEmail,
    [{ productId: 'lp_idemp_sku', serverCluster: 'Server 2', title: 'Twitter Verified Profile', quantity: 1, unitPriceNgn: 300 }],
    'wallet',
    stableIdempKey
  );

  const balAfterSecond = walletService.getBalance(userA);

  assert(firstAttempt.id === secondAttempt.id, 'Idempotent checkout returned identical order');
  assert(firstAttempt.reference === secondAttempt.reference, 'Order reference identical across retries');
  assert(balAfterFirst === balAfterSecond, 'User wallet was NOT charged a second time on replay');

  // ---------------------------------------------------------
  // TEST 8: Catalog sorting, filtering, and pagination stability.
  // ---------------------------------------------------------
  console.log('\n--- TEST 8: Catalog Pagination & Identity Stability ---');
  const page1 = await catalogService.getCatalogPaginated({ page: 1, limit: 5 });
  assert(page1.products.length > 0, 'Catalog page 1 returned products');
  const firstProd = page1.products[0];
  assert(Boolean(firstProd.id && firstProd.title), 'Product has authoritative ID and Title');

  const resolvedDirectly = await catalogService.getProductByIdOrSlugAsync(firstProd.id);
  assert(resolvedDirectly.id === firstProd.id, 'Direct lookup matches catalog pagination result');

  // ---------------------------------------------------------
  // TEST 9: Customer reloads order history. Vault secrets remain consistent.
  // ---------------------------------------------------------
  console.log('\n--- TEST 9: Order History Consistency & Vault Persistence ---');
  const customerOrders = orderService.getOrders(userA, userAEmail);
  const foundFbOrder = customerOrders.find(o => o.id === fbOrder.id);
  assert(Boolean(foundFbOrder), 'Historical Facebook order retrievable from order history');
  assert(foundFbOrder!.items[0].deliveredSecrets?.[0]?.value === fbSecret.secret, 'Delivered credentials identical on order reload');

  // ---------------------------------------------------------
  // TEST 10: Cross-tenant / RLS Security.
  // Customer attempts to view another customer’s order. Access denied.
  // ---------------------------------------------------------
  console.log('\n--- TEST 10: Cross-Customer Access Control (RLS Denial) ---');
  let accessDenied = false;
  try {
    // User A attempts to reveal User B's Twitter secret
    orderService.revealSecret(userA, twOrder.id, twOrder.items[0].id);
  } catch (err: any) {
    accessDenied = true;
    assert(err.status === 403 || err.statusCode === 403, 'Forbidden 403 returned when accessing another user order');
  }
  assert(accessDenied, 'Cross-customer vault access blocked');

  console.log('\n======================================================');
  console.log(`🏁 ALL ${passedCount} AUDIT TEST ASSERTIONS PASSED (10/10 TESTS)`);
  console.log('======================================================\n');
}

runAuditTests().catch(err => {
  console.error('\n❌ AUDIT SUITE FAILED:', err);
  process.exit(1);
});
