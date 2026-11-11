process.env.NODE_ENV = 'test';
import { encryptPayload, decryptPayload, hashFingerprint } from '../src/utils/crypto.js';
import { walletService } from '../src/services/wallet.service.js';
import { orderService } from '../src/services/order.service.js';
import { numbersService } from '../src/services/numbers.service.js';
import { serverApiRegistry } from '../src/adapters/server/server.registry.js';

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING OJALOGS PHASE 3 BACKEND TESTS');
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

  // 1. Crypto Tests
  console.log('--- 1. Security & Vault Cryptography ---');
  const sampleKey = 'OJ-PRO-2026-X99Q-88LV-M21K';
  const ciphertext = encryptPayload(sampleKey);
  assert(ciphertext !== sampleKey, 'Plaintext is encrypted into ciphertext');
  assert(ciphertext.includes(':'), 'Ciphertext contains iv:tag:data envelope');

  const decrypted = decryptPayload(ciphertext);
  assert(decrypted === sampleKey, 'Ciphertext decrypts back to exact original key');

  const fp1 = hashFingerprint('KEY-123');
  const fp2 = hashFingerprint('KEY-123');
  assert(fp1 === fp2, 'Fingerprint generation is deterministic for duplicate detection');

  // 2. Multi-Server API Adapter Tests
  console.log('\n--- 2. Multi-Server API Adapters ---');
  const healthMatrix = await serverApiRegistry.getAllHealth();
  assert(healthMatrix['Server 1']?.healthy === true, 'Server 1 API (VPNs, Proxies, eSIM) is healthy');
  assert(healthMatrix['Server 2']?.healthy === true, 'Server 2 API (Social Media Accounts, Cloud) is healthy');
  assert(healthMatrix['Server 3']?.healthy === true, 'Server 3 API (Software & OS) is healthy');
  assert(healthMatrix['Server 4']?.healthy === true, 'Server 4 API (AI Tools) is healthy');

  // Test provisioning from Server 2 (Social Accounts)
  const srv2Adapter = serverApiRegistry.getAdapter('Server 2');
  const provisionedSocial = await srv2Adapter.provisionSecret('instagram-aged', 'ord_test_01');
  assert(provisionedSocial.secretKey.length > 10, 'Server 2 API provisions aged account with 2FA key');

  // 3. Wallet & Ledger Tests
  console.log('\n--- 3. Immutable Wallet & Ledger ---');
  const userId = 'usr_oj_test_99';
  
  // Initial credit
  walletService.creditWallet(userId, 50000, 'deposit', 'ref_oj_test_1', 'Test funding deposit');
  assert(walletService.getBalance(userId) === 50000, 'Wallet credited to ₦50,000');

  // Debit for purchase
  walletService.debitWallet(userId, 15000, 'order_payment', 'ref_oj_test_2', 'Order purchase');
  assert(walletService.getBalance(userId) === 35000, 'Wallet debited accurately to ₦35,000');

  // Insufficient funds block test
  let caughtInsufficient = false;
  try {
    walletService.debitWallet(userId, 100000, 'order_payment', 'ref_oj_fail', 'Overdraft attempt');
  } catch (err: any) {
    if (err.code === 'INSUFFICIENT_FUNDS') caughtInsufficient = true;
  }
  assert(caughtInsufficient, 'Overdraft blocked by wallet balance check');

  // Verify ledger append-only log
  const txs = walletService.getLedger(userId);
  assert(txs.length === 2, 'Wallet ledger recorded exactly 2 immutable transactions');
  assert(txs[0].balanceAfterNgn === 35000, 'Ledger accurately records balance_after');

  // 4. Order & Vault Fulfillment
  console.log('\n--- 4. Order & Encrypted Delivery Vault ---');
  const order = await orderService.checkout(
    userId,
    'tester@ojalogs.dev',
    [
      {
        productId: 'prod_social_01',
        serverCluster: 'Server 2',
        title: 'Instagram Aged Profile',
        quantity: 1,
        unitPriceNgn: 14500
      }
    ],
    'wallet',
    'idempotency_key_test_order_01'
  );

  assert(order.status === 'completed', 'Order completed successfully via wallet');
  assert(walletService.getBalance(userId) === 20500, 'Wallet debited for order total');
  assert(order.items[0].deliveredSecrets![0].revealed === false, 'Vault secret is sealed initially');

  const revealed = orderService.revealSecret(userId, order.id, order.items[0].id);
  assert(revealed.revealed === true && revealed.secret.length > 5, 'Vault secret revealed upon customer request');

  // 5. Virtual Numbers & SMS Auto-Refund
  console.log('\n--- 5. Division B Virtual Numbers & Telephony ---');
  const country = { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', availableNumbers: 1000 };
  const service = { id: 'whatsapp', name: 'WhatsApp', category: 'Messaging', icon: 'MessageCircle', priceNgn: 1450, successRate: 98.4 };

  const session = await numbersService.requestNumber(
    userId,
    country,
    service,
    'one_time_sms',
    'idempotency_key_num_01'
  );

  assert(session.status === 'active', 'Virtual line allocated with active countdown');
  assert(session.phoneNumber.startsWith('+1'), 'Phone number properly allocated matching country dial code');

  // Inbound SMS simulation
  const sms = numbersService.receiveIncomingSms(session.id, 'VERIFY', '849201', 'Your WhatsApp code is 849201');
  assert(sms.code === '849201', 'Incoming SMS code extracted successfully');
  assert(session.status === 'sms_received', 'Session transitioned to sms_received');

  // Test Cancellation & Refund on a second number
  const session2 = await numbersService.requestNumber(
    userId,
    country,
    service,
    'one_time_sms',
    'idempotency_key_num_02'
  );

  const preCancelBalance = walletService.getBalance(userId);
  const cancelRes = await numbersService.cancelAndRefund(userId, session2.id);
  assert(cancelRes.cancelled === true, 'Session cancelled');
  assert(walletService.getBalance(userId) === preCancelBalance + 1450, '100% refund credited back to wallet');

  console.log('\n========================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

