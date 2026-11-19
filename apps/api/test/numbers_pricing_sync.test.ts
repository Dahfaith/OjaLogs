process.env.NODE_ENV = 'test';
import { walletService } from '../src/services/wallet.service.js';
import { numbersService } from '../src/services/numbers.service.js';
import { getServicePriceForCountry } from '@ojalogs/shared';

async function runNumbersPricingTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING OJALOGS SMS PRICING SYNCHRONIZATION TESTS');
  console.log('======================================================\n');

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

  const userId = `usr_test_pricing_${Date.now()}`;
  walletService.creditWallet(userId, 1070, 'deposit', `ref_test_fund_${Date.now()}`, 'Initial balance ₦1,070');

  // --- 1. Service price matches checkout price ---
  console.log('--- 1. Service price matches checkout price ---');
  const twitterQuote = numbersService.calculateAuthoritativePrice('x-twitter', 'US', 'one_time_sms');
  assert(twitterQuote.totalPriceNgn === 750, `Twitter US floor price is ₦750 (got ₦${twitterQuote.totalPriceNgn})`);
  assert(twitterQuote.service.id.includes('twitter') || twitterQuote.service.name.toLowerCase().includes('twitter'), 'Resolved service is Twitter/X');

  const waQuote = numbersService.calculateAuthoritativePrice('whatsapp', 'US', 'one_time_sms');
  assert(waQuote.totalPriceNgn === 4850, `WhatsApp US floor price is ₦4,850 (got ₦${waQuote.totalPriceNgn})`);

  // --- 2. Changing country updates pricing ---
  console.log('\n--- 2. Changing country updates pricing ---');
  const twGbQuote = numbersService.calculateAuthoritativePrice('x-twitter', 'GB', 'one_time_sms');
  assert(twGbQuote.totalPriceNgn === 850, `Twitter UK price is ₦850 (got ₦${twGbQuote.totalPriceNgn})`);
  assert(twGbQuote.country.code === 'GB', 'Country resolved to GB');

  const waNgQuote = numbersService.calculateAuthoritativePrice('whatsapp', 'NG', 'one_time_sms');
  assert(waNgQuote.totalPriceNgn === 2200, `WhatsApp NG price is ₦2,200 (got ₦${waNgQuote.totalPriceNgn})`);

  // --- 3. Changing platform updates pricing ---
  console.log('\n--- 3. Changing platform updates pricing ---');
  const tgQuote = numbersService.calculateAuthoritativePrice('telegram', 'US', 'one_time_sms');
  assert(tgQuote.totalPriceNgn === 3650, `Telegram US price is ₦3,650 (got ₦${tgQuote.totalPriceNgn})`);

  const igQuote = numbersService.calculateAuthoritativePrice('instagram', 'US', 'one_time_sms');
  assert(igQuote.totalPriceNgn === 1350, `Instagram US price is ₦1,350 (got ₦${igQuote.totalPriceNgn})`);

  const gQuote = numbersService.calculateAuthoritativePrice('google', 'US', 'one_time_sms');
  assert(gQuote.totalPriceNgn === 1950, `Google US price is ₦1,950 (got ₦${gQuote.totalPriceNgn})`);

  const ttQuote = numbersService.calculateAuthoritativePrice('tiktok', 'US', 'one_time_sms');
  assert(ttQuote.totalPriceNgn === 550, `TikTok US price is ₦550 (got ₦${ttQuote.totalPriceNgn})`);

  // --- 4. Changing rental type updates pricing ---
  console.log('\n--- 4. Changing rental type updates pricing ---');
  const twRentalQuote = numbersService.calculateAuthoritativePrice('x-twitter', 'US', 'long_term_rental');
  assert(twRentalQuote.totalPriceNgn === 3750, `Twitter long-term rental is 5x = ₦3,750 (got ₦${twRentalQuote.totalPriceNgn})`);

  const waRentalQuote = numbersService.calculateAuthoritativePrice('whatsapp', 'US', 'long_term_rental');
  assert(waRentalQuote.totalPriceNgn === 24250, `WhatsApp long-term rental is 5x = ₦24,250 (got ₦${waRentalQuote.totalPriceNgn})`);

  // --- 5. Insufficient wallet balance displays the correct amount ---
  console.log('\n--- 5. Insufficient wallet balance displays correct amount ---');
  const userBal = walletService.getBalance(userId);
  assert(userBal === 1070, `User balance is ₦1,070 (got ₦${userBal})`);
  
  // Wallet has ₦1,070. WhatsApp costs ₦4,850. Deficit is ₦3,780.
  const deficitWa = waQuote.totalPriceNgn - userBal;
  assert(deficitWa === 3780, `Deficit for WhatsApp correctly computed as ₦3,780 (got ₦${deficitWa})`);

  // Twitter costs ₦750. Wallet has ₦1,070. Sufficient funds!
  assert(userBal >= twitterQuote.totalPriceNgn, `Wallet ₦1,070 is SUFFICIENT for Twitter ₦750`);

  // --- 6. Supplier price changes are handled safely / Checkout protection ---
  console.log('\n--- 6. Supplier price changes handled safely (PRICE_CHANGED) ---');
  let priceChangeCaught = false;
  try {
    // Client thought price was ₦500, but authoritative is ₦750
    await numbersService.requestNumber(
      userId,
      twitterQuote.country,
      twitterQuote.service,
      'one_time_sms',
      `idem_price_change_${Date.now()}`,
      500 // expectedPrice mismatch
    );
  } catch (err: any) {
    if (err.code === 'PRICE_CHANGED' || err.message?.includes('PRICE_CHANGED') || err.message?.includes('updated')) {
      priceChangeCaught = true;
    }
  }
  assert(priceChangeCaught, 'Mismatched expectedPrice rejected with PRICE_CHANGED exception');
  assert(walletService.getBalance(userId) === 1070, 'Wallet balance remained completely untouched after PRICE_CHANGED rejection');

  // --- 7. No blind fallback to WhatsApp (mockServices[0]) ---
  console.log('\n--- 7. Semantic lookup prevents fallback to WhatsApp ---');
  const xcomService = numbersService.findService('x.com / twitter');
  assert(xcomService !== undefined, 'Found service by full display name "x.com / twitter"');
  assert(xcomService?.id !== 'whatsapp', 'Did NOT fall back to WhatsApp');

  const twIdService = numbersService.findService('twitter');
  assert(twIdService !== undefined, 'Found service by keyword "twitter"');
  assert(twIdService?.id !== 'whatsapp', 'Did NOT fall back to WhatsApp');

  // --- 8. No wallet deduction occurs when allocation fails ---
  console.log('\n--- 8. Wallet protection on allocation failure ---');
  const balBeforeFail = walletService.getBalance(userId);
  let allocationFailed = false;
  try {
    await numbersService.requestNumber(
      userId,
      twitterQuote.country,
      { id: 'non-existent-telephony-service-xyz', name: 'NonExistent', category: 'General', icon: '❓', priceNgn: 500, successRate: 0 },
      'one_time_sms',
      `idem_invalid_${Date.now()}`,
      750
    );
  } catch {
    allocationFailed = true;
  }
  assert(allocationFailed, 'Allocation correctly failed for invalid service');
  const balAfterFail = walletService.getBalance(userId);
  assert(balBeforeFail === balAfterFail, 'Wallet balance was NOT debited when allocation failed');

  // --- 9. Successful allocations use the confirmed price ---
  console.log('\n--- 9. Successful allocation debits exact confirmed price ---');
  const session = await numbersService.requestNumber(
    userId,
    twitterQuote.country,
    twitterQuote.service,
    'one_time_sms',
    `idem_succ_${Date.now()}`,
    750
  );
  assert(session && session.phoneNumber.length > 5, `Allocated phone line: ${session.phoneNumber}`);
  const balAfterTwitter = walletService.getBalance(userId);
  assert(balAfterTwitter === 1070 - 750, `Wallet debited exactly ₦750: New balance ₦${balAfterTwitter} (expected ₦320)`);

  // --- 10. Concurrent requests cannot cause an outdated price to appear ---
  console.log('\n--- 10. Concurrent quotes are deterministic and race-condition protected ---');
  const quotes = await Promise.all([
    numbersService.calculateAuthoritativePrice('x-twitter', 'US', 'one_time_sms'),
    numbersService.calculateAuthoritativePrice('x-twitter', 'US', 'one_time_sms'),
    numbersService.calculateAuthoritativePrice('whatsapp', 'US', 'one_time_sms'),
    numbersService.calculateAuthoritativePrice('tiktok', 'US', 'one_time_sms')
  ]);
  assert(quotes[0].totalPriceNgn === 750, 'Concurrent Quote 1 (Twitter): ₦750');
  assert(quotes[1].totalPriceNgn === 750, 'Concurrent Quote 2 (Twitter): ₦750');
  assert(quotes[2].totalPriceNgn === 4850, 'Concurrent Quote 3 (WhatsApp): ₦4,850');
  assert(quotes[3].totalPriceNgn === 550, 'Concurrent Quote 4 (TikTok): ₦550');

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNumbersPricingTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
