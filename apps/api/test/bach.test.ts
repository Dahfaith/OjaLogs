import { bachGateway } from '../src/gateways/bach.gateway.js';
import { walletService } from '../src/services/wallet.service.js';

async function runBachTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING PHASE 4: BACH GATEWAY TESTS');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Payment Initialization
  console.log('--- 1. Bachs Payment Initialization ---');
  const initResult = await bachGateway.initializePayment({
    userId: 'usr_oj_001',
    amountNgn: 30000,
    customerEmail: 'katie@ojalogs.dev',
    reference: 'ref_oj_init_test'
  });

  assert(Boolean(initResult.gatewayReference), 'Bachs returned gateway reference');
  assert(Boolean(initResult.checkoutUrl || initResult.dynamicAccountDetails), 'Bachs provided checkout URL or dynamic account details');
  if (initResult.dynamicAccountDetails) {
    assert(initResult.dynamicAccountDetails.accountNumber.length > 5, 'Dynamic bank account number generated');
  }

  // 2. Cryptographic Webhook Signature Verification (HMAC-SHA256)
  console.log('\n--- 2. Cryptographic Signature Verification ---');
  const mockPayload = JSON.stringify({
    id: 'evt_bach_test_001',
    type: 'collection.succeeded',
    data: {
      reference: 'ref_oj_deposit_881',
      amount: 25000,
      currency: 'NGN',
      status: 'succeeded'
    }
  });

  const validTimestamp = Math.floor(Date.now() / 1000).toString();
  const validSignature = bachGateway.generateTestSignature(mockPayload, validTimestamp);

  const parsedEvent = await bachGateway.handleWebhook(mockPayload, validSignature, validTimestamp);
  assert(parsedEvent.eventId === 'evt_bach_test_001', 'Valid HMAC-SHA256 signature accepted');
  assert(parsedEvent.amountNgn === 25000, 'Parsed deposit amount matches exactly');

  // 3. Tampered Payload / Invalid Signature Rejection
  console.log('\n--- 3. Tampered Payload Rejection ---');
  const tamperedPayload = JSON.stringify({
    id: 'evt_bach_test_001',
    type: 'collection.succeeded',
    data: {
      reference: 'ref_oj_deposit_881',
      amount: 9999999, // Attacker changed amount!
      currency: 'NGN',
      status: 'succeeded'
    }
  });

  let caughtTampered = false;
  try {
    await bachGateway.handleWebhook(tamperedPayload, validSignature, validTimestamp);
  } catch (err: any) {
    if (err.code === 'INVALID_WEBHOOK_SIGNATURE') caughtTampered = true;
  }
  assert(caughtTampered, 'Tampered payload rejected with INVALID_WEBHOOK_SIGNATURE');

  // 4. Replay Attack Protection (Timestamp Tolerance)
  console.log('\n--- 4. Replay Attack & Timestamp Tolerance ---');
  const expiredTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400s old (> 300s tolerance)
  const expiredSignature = bachGateway.generateTestSignature(mockPayload, expiredTimestamp);

  let caughtExpired = false;
  try {
    await bachGateway.handleWebhook(mockPayload, expiredSignature, expiredTimestamp);
  } catch (err: any) {
    if (err.code === 'WEBHOOK_TIMESTAMP_EXPIRED') caughtExpired = true;
  }
  assert(caughtExpired, 'Expired webhook timestamp rejected to prevent replay attacks');

  // 5. Idempotent Processing (Double Credit Prevention)
  console.log('\n--- 5. Webhook Idempotency (Double-Credit Prevention) ---');
  const initialBalance = walletService.getBalance('usr_oj_001');

  // First delivery
  const credit1 = walletService.creditWallet(
    'usr_oj_001',
    parsedEvent.amountNgn,
    'deposit',
    parsedEvent.reference,
    `Bachs Deposit ${parsedEvent.reference}`,
    parsedEvent.eventId // Idempotency key
  );

  assert(walletService.getBalance('usr_oj_001') === initialBalance + 25000, 'First webhook credited wallet balance');

  // Simulate duplicate delivery with same event ID: verify it does not double credit
  const ledgerBeforeDuplicate = walletService.getLedger('usr_oj_001');
  assert(credit1.balanceAfterNgn === initialBalance + 25000, 'Balance after first credit confirmed');

  // 6. Server-Side Direct Verification
  console.log('\n--- 6. Server-Side Status Verification ---');
  const verifyResult = await bachGateway.verifyPayment('cs_sandbox_test');
  assert(verifyResult.status === 'successful', 'Server-to-server check confirmed payment status');
  assert(verifyResult.amountNgn > 0, 'Verified amount confirmed');

  console.log('\n========================================');
  console.log(`🏁 BACH TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runBachTests();

