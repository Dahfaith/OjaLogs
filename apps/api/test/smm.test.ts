import { smmService } from '../src/services/smm.service.js';
import { walletService } from '../src/services/wallet.service.js';

console.log('\n========================================');
console.log('🧪 RUNNING PHASE 6: SMM & SOCIAL BOOST TESTS');
console.log('========================================\n');

async function runTests() {
  const testUserId = 'usr_smm_test_user';
  walletService.creditWallet(testUserId, 50000, 'deposit', 'dep_smm_01', 'Test Deposit for SMM');

  // 1. Retrieve Services & Rate Calculation
  console.log('--- 1. Service Retrieval & Pricing Engine ---');
  const services = smmService.getPublicServices();
  if (services.length < 5) throw new Error('Expected at least 5 public SMM services');
  console.log(`✅ PASS: Retrieved ${services.length} active SMM services across platforms`);

  const igService = services.find(s => s.platform === 'instagram');
  if (!igService) throw new Error('Instagram service not found');
  console.log(`✅ PASS: Found ${igService.name} - Retail Rate: ₦${igService.retailRateNgn}/1k (Cost: ₦${igService.sourceRateNgn})`);

  // 2. Admin Price Override (Sample: change rate to custom value)
  console.log('\n--- 2. Admin Custom Price Override ---');
  const updatedRate = 6500;
  const updatedService = smmService.updateServiceRate(igService.id, updatedRate);
  if (updatedService.retailRateNgn !== 6500) throw new Error('Rate override failed');
  console.log(`✅ PASS: Admin successfully overrode retail rate to ₦${updatedService.retailRateNgn}/1k`);

  // 3. Customer Place Order & Ledger Debit
  console.log('\n--- 3. Customer SMM Order Placement ---');
  const balanceBefore = walletService.getBalance(testUserId);
  const qty = 2000;
  const expectedTotal = (updatedRate / 1000) * qty; // 6500 / 1000 * 2000 = 13000

  const order = await smmService.placeOrder(
    testUserId,
    'tester@ojalogs.com',
    igService.id,
    'https://instagram.com/p/test-post',
    qty,
    `idemp_smm_test_${Date.now()}`
  );

  if (order.totalNgn !== expectedTotal) {
    throw new Error(`Order total mismatch. Expected ${expectedTotal}, got ${order.totalNgn}`);
  }
  const balanceAfter = walletService.getBalance(testUserId);
  if (balanceBefore - balanceAfter !== expectedTotal) {
    throw new Error('Wallet debit amount does not match order total');
  }
  console.log(`✅ PASS: SMM order ${order.reference} placed for ₦${order.totalNgn} (Debited exactly ₦${expectedTotal})`);

  // 4. Standard Reseller API Protocol Test
  console.log('\n--- 4. Standard SMM Reseller API Protocol ---');
  const resellerServices = await smmService.handleStandardSMMRequest({ action: 'services' });
  if (!Array.isArray(resellerServices) || resellerServices.length === 0) {
    throw new Error('Reseller services action failed');
  }
  console.log(`✅ PASS: Reseller "services" action returned ${resellerServices.length} standard SMM catalog items`);

  const resellerStatus = await smmService.handleStandardSMMRequest({ action: 'status', order: order.reference });
  if (!resellerStatus || !resellerStatus.status) {
    throw new Error('Reseller status action failed');
  }
  console.log(`✅ PASS: Reseller "status" action returned status "${resellerStatus.status}" and charge ₦${resellerStatus.charge}`);

  const resellerBalance = await smmService.handleStandardSMMRequest({ action: 'balance' }, { id: testUserId, email: 'tester@ojalogs.com' });
  if (!resellerBalance || !resellerBalance.balance) {
    throw new Error('Reseller balance action failed');
  }
  console.log(`✅ PASS: Reseller "balance" action returned balance ₦${resellerBalance.balance}`);

  console.log('\n========================================');
  console.log('🏁 SMM TESTS: 4/4 PASSED, 0 FAILED');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('❌ SMM TEST FAILED:', err);
  process.exit(1);
});
