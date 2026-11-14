import assert from 'assert';
import { catalogService } from '../src/services/catalog.service.js';
import { walletService } from '../src/services/wallet.service.js';
import { orderService } from '../src/services/order.service.js';
import { numbersService } from '../src/services/numbers.service.js';
import { decryptPayload } from '../src/utils/crypto.js';
import { serverApiRegistry } from '../src/adapters/server/server.registry.js';

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`✅ PASS: ${desc}`);
          passed++;
        })
        .catch((err) => {
          console.error(`❌ FAIL: ${desc}`);
          console.error(err);
          failed++;
        });
    }
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc}`);
    console.error(err);
    failed++;
  }
}

async function runPhase5Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 5: BUSINESS LOGIC & E2E INTEGRATION');
  console.log('======================================================\n');

  const testUserId = `usr_e2e_${Date.now()}`;
  const testEmail = 'e2e.tester@ojalogs.dev';

  // --- SECTION 1: CATALOG SERVICES & SERVER ADAPTERS ---
  console.log('--- 1. Multi-Server Catalog & Upstream Health ---');

  await it('Retrieves complete catalog across all 4 logical servers', () => {
    const allProducts = catalogService.getProducts();
    assert(allProducts.length >= 8, 'Expected at least 8 catalog products');
    
    const server1 = catalogService.getProducts({ serverCluster: 'Server 1' });
    const server2 = catalogService.getProducts({ serverCluster: 'Server 2' });
    const server3 = catalogService.getProducts({ serverCluster: 'Server 3' });
    const server4 = catalogService.getProducts({ serverCluster: 'Server 4' });

    assert(server1.length > 0, 'Server 1 products must exist');
    assert(server2.length > 0, 'Server 2 products must exist');
    assert(server3.length > 0, 'Server 3 products must exist');
    assert(server4.length > 0, 'Server 4 products must exist');
  });

  await it('Filters catalog by category and keyword search accurately', () => {
    const vpnProducts = catalogService.getProducts({ category: 'vpn' });
    assert(vpnProducts.every(p => p.categoryId === 'vpn'), 'All filtered products must be VPN');

    const searchRes = catalogService.getProducts({ search: 'Instagram' });
    assert(searchRes.some(p => p.title.includes('Instagram')), 'Search should find Instagram');
  });

  await it('Retrieves individual product by slug or id', () => {
    const prod = catalogService.getProductByIdOrSlug('global-travel-esim-10gb-5g');
    assert.strictEqual(prod.id, 'prod_esim_01');
    assert.strictEqual(prod.serverCluster, 'Server 1');
  });

  // --- SECTION 2: WALLET FUNDING & LEDGER INTEGRITY ---
  console.log('\n--- 2. NGN Wallet Top-up & Ledger Integrity ---');

  await it('Initiates funding with dynamic Bachs bank account', async () => {
    const fundRes = await walletService.initiateFunding(testUserId, 150000, testEmail, 'idem_fund_01');
    assert(fundRes.reference.startsWith('ref_oj_'));
    assert.strictEqual(fundRes.amountNgn, 150000);
    assert(fundRes.dynamicAccountDetails?.accountNumber, 'Must generate temporary funding account number');
  });

  await it('Credits wallet ledger with verifiable reference', () => {
    walletService.creditWallet(testUserId, 150000, 'deposit', 'ref_oj_deposit_e2e', 'Bachs Bank Transfer Top-Up');
    const balance = walletService.getBalance(testUserId);
    assert.strictEqual(balance, 150000);

    const ledger = walletService.getLedger(testUserId);
    assert.strictEqual(ledger.length, 1);
    assert.strictEqual(ledger[0].amountNgn, 150000);
    assert.strictEqual(ledger[0].type, 'credit');
  });

  // --- SECTION 3: MULTI-SERVER CHECKOUT & VAULT ENCRYPTION ---
  console.log('\n--- 3. Multi-Server Checkout & AES-256-GCM Vault ---');

  let testOrderId = '';
  let testOrderItems: any[] = [];

  await it('Processes multi-server checkout order with 4 server tiers', async () => {
    const cartItems = [
      { productId: 'prod_vpn_01', serverCluster: 'Server 1' as const, title: 'NordVPN 1-Year', quantity: 1, unitPriceNgn: 18500 },
      { productId: 'prod_social_01', serverCluster: 'Server 2' as const, title: 'Instagram Aged 2FA', quantity: 1, unitPriceNgn: 14500 },
      { productId: 'prod_soft_01', serverCluster: 'Server 3' as const, title: 'Windows 11 Pro', quantity: 1, unitPriceNgn: 8500 },
      { productId: 'prod_ai_01', serverCluster: 'Server 4' as const, title: 'ChatGPT Plus 1-Month', quantity: 1, unitPriceNgn: 31500 }
    ];

    const totalNgn = 18500 + 14500 + 8500 + 31500; // 73,000

    const order = await orderService.checkout(testUserId, testEmail, cartItems, 'wallet', 'idem_chk_01');
    assert(order.reference.startsWith('ord_oj_'));
    assert.strictEqual(order.totalNgn, totalNgn);
    assert.strictEqual(order.items.length, 4);

    testOrderId = order.id;
    testOrderItems = order.items;

    // Verify wallet debited correctly
    const balance = walletService.getBalance(testUserId);
    assert.strictEqual(balance, 150000 - totalNgn);
  });

  await it('Guarantees delivered secrets are encrypted and masked before reveal', () => {
    for (const item of testOrderItems) {
      assert(item.deliveredSecrets.length > 0, 'Item must have delivered secret');
      const sec = item.deliveredSecrets[0];
      assert.strictEqual(sec.revealed, false, 'Secret must be unrevealed initially');
      assert.strictEqual(sec.value, '••••••••••••••••••••••••••••••', 'Value must be masked');
      assert(sec.encryptedPayload, 'Encrypted ciphertext envelope must exist');
    }
  });

  await it('Audits and decrypts secret upon customer vault reveal', () => {
    const firstItem = testOrderItems[0];
    const revealed = orderService.revealSecret(testUserId, testOrderId, firstItem.id);

    assert.strictEqual(revealed.revealed, true);
    assert.notStrictEqual(revealed.secret, '••••••••••••••••••••••••••••••');
    assert(revealed.secret.startsWith('NORD-PRO-') || revealed.secret.length > 10, `Expected decrypted key, got ${revealed.secret}`);
    assert(!revealed.secret.includes('•'), 'Secret must not be masked');
    assert.strictEqual(revealed.revealCount, 1);
    assert(revealed.lastRevealedAt, 'Reveal timestamp must be recorded');
  });

  // --- SECTION 4: DIVISION B VIRTUAL NUMBERS & INBOUND SMS ---
  console.log('\n--- 4. Division B Virtual Numbers & Telephony ---');

  let activeSessionId = '';

  await it('Allocates virtual phone line with 15-minute countdown and debits wallet', async () => {
    const countries = numbersService.getCountries();
    const services = numbersService.getServices();

    const initialBal = walletService.getBalance(testUserId);
    const session = await numbersService.requestNumber(testUserId, countries[0], services[0], 'one_time_sms', 'idem_num_e2e_1');

    assert(session.reference.startsWith('req_num_'));
    assert(session.phoneNumber.startsWith(countries[0].dialCode));
    assert.strictEqual(session.status, 'active');
    assert.strictEqual(session.timeRemainingSeconds, 900);
    assert.strictEqual(session.canCancel, true);

    activeSessionId = session.id;

    const newBal = walletService.getBalance(testUserId);
    assert.strictEqual(newBal, initialBal - services[0].priceNgn);
  });

  await it('Receives incoming simulated SMS, extracts OTP code, and locks cancellation', () => {
    const code = '749201';
    const msg = numbersService.simulateIncomingSms(activeSessionId, 'WHATSAPP', code);

    assert.strictEqual(msg.code, code);
    assert(msg.fullText.includes(code));

    const session = numbersService.getSession(activeSessionId);
    assert(session);
    assert.strictEqual(session.status, 'sms_received');
    assert.strictEqual(session.canCancel, false);
    assert.strictEqual(session.messages.length, 1);
  });

  // --- SECTION 5: AUTOMATED 100% REFUND PROCESSOR ---
  console.log('\n--- 5. Automated 100% Refund & Cancellation Engine ---');

  await it('Allows customer to cancel active unreceived line and receives instant 100% refund', async () => {
    const countries = numbersService.getCountries();
    const services = numbersService.getServices();

    const session2 = await numbersService.requestNumber(testUserId, countries[1], services[1], 'one_time_sms', 'idem_num_e2e_2');
    const balBefore = walletService.getBalance(testUserId);

    const cancelRes = await numbersService.cancelAndRefund(testUserId, session2.id);
    assert.strictEqual(cancelRes.cancelled, true);
    assert.strictEqual(cancelRes.refundedAmount, session2.priceNgn);

    const balAfter = walletService.getBalance(testUserId);
    assert.strictEqual(balAfter, balBefore + session2.priceNgn);

    const updatedSession = numbersService.getSession(session2.id);
    assert.strictEqual(updatedSession?.status, 'cancelled');
  });

  await it('Cron automatically reconciles expired sessions and credits 100% refund', async () => {
    const countries = numbersService.getCountries();
    const services = numbersService.getServices();

    const session3 = await numbersService.requestNumber(testUserId, countries[2], services[2], 'one_time_sms', 'idem_num_e2e_3');
    const balBefore = walletService.getBalance(testUserId);

    // Fast forward session3 expiresAt to simulate 15-minute countdown expiration
    session3.expiresAt = new Date(Date.now() - 5000).toISOString();

    const cronRes = await numbersService.reconcileExpiredRentals();
    assert(cronRes.expiredCount >= 1, 'Cron must find at least 1 expired session');
    assert.strictEqual(cronRes.totalRefundedNgn, session3.priceNgn);

    const balAfter = walletService.getBalance(testUserId);
    assert.strictEqual(balAfter, balBefore + session3.priceNgn);

    const updatedSession = numbersService.getSession(session3.id);
    assert.strictEqual(updatedSession?.status, 'refunded');
  });

  // --- SECTION 6: IMMUTABLE LEDGER RECONCILIATION AUDIT ---
  console.log('\n--- 6. Mathematical Ledger Balance Reconciliation ---');

  await it('Verifies all credits minus debits mathematically equal current balance', () => {
    const ledger = walletService.getLedger(testUserId);
    const currentBalance = walletService.getBalance(testUserId);

    let calculatedBalance = 0;
    // Iterate from oldest to newest
    const chronoSorted = [...ledger].reverse();

    for (const tx of chronoSorted) {
      if (tx.type === 'credit') {
        calculatedBalance += tx.amountNgn;
      } else if (tx.type === 'debit') {
        calculatedBalance -= tx.amountNgn;
      }
      assert.strictEqual(calculatedBalance, tx.balanceAfterNgn, 'balanceAfterNgn must match running total');
    }

    assert.strictEqual(calculatedBalance, currentBalance, 'Mathematical ledger sum must equal wallet balance');
    console.log(`   ⚖️ Audited ${ledger.length} immutable ledger records: Final balance ₦${currentBalance.toLocaleString()} confirmed.`);
  });

  console.log('\n======================================================');
  console.log(`🏁 PHASE 5 TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
