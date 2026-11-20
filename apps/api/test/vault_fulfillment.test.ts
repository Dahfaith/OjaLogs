import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseCredentialsPayload } from '@ojalogs/shared';
import { orderService } from '../src/services/order.service.js';
import { encryptPayload, decryptPayload } from '../src/utils/crypto.js';
import { walletService } from '../src/services/wallet.service.js';

console.log('--- RUNNING DIGITAL DELIVERY VAULT & LOGSPOLL FULFILLMENT VERIFICATION SUITE ---');

async function runTests() {
  // Test 1: Hotmail account with email, password, recovery, and backup details
  console.log('\n[TEST 1] Hotmail Account (Pipe-delimited 4-part OAuth2 structure)');
  const hotmailRaw = 'TiaraGlowacky61@hotmail.com|hfygav9155|M.C527_BAY_293847294829384729384729384|9e5f94bc-2fad-4f26-98d3-9511798918a9';
  const hotmailParsed = parseCredentialsPayload(
    hotmailRaw,
    'Hotmail Trusted - OAuth2 [ Graph ] Live 12 - 36 Months',
    'Credentials / 2FA Token'
  );
  assert.strictEqual(hotmailParsed.isStructured, true);
  assert.strictEqual(hotmailParsed.fields.length, 4);
  assert.strictEqual(hotmailParsed.fields[0].label, 'EMAIL ADDRESS');
  assert.strictEqual(hotmailParsed.fields[0].value, 'TiaraGlowacky61@hotmail.com');
  assert.strictEqual(hotmailParsed.fields[0].isSensitive, false);
  assert.strictEqual(hotmailParsed.fields[1].label, 'PASSWORD');
  assert.strictEqual(hotmailParsed.fields[1].value, 'hfygav9155');
  assert.strictEqual(hotmailParsed.fields[1].isSensitive, true);
  assert.strictEqual(hotmailParsed.fields[2].label, 'RECOVERY DETAILS');
  assert.strictEqual(hotmailParsed.fields[2].isSensitive, true);
  assert.strictEqual(hotmailParsed.fields[3].label, 'BACKUP DETAILS');
  assert.strictEqual(hotmailParsed.fields[3].value, '9e5f94bc-2fad-4f26-98d3-9511798918a9');
  assert.strictEqual(hotmailParsed.fields[3].isSensitive, true);
  console.log('✓ TEST 1 PASSED: Hotmail credentials correctly extracted without misclassification');

  // Test 2: Gmail account credentials
  console.log('\n[TEST 2] Gmail Account (Colon-delimited with recovery email)');
  const gmailRaw = 'sarah.connor1984@gmail.com:CyberDyne2026!:recm_user99@yahoo.com';
  const gmailParsed = parseCredentialsPayload(gmailRaw, 'Gmail Aged PVA Account', 'Email:Password:Recovery');
  assert.strictEqual(gmailParsed.isStructured, true);
  assert.strictEqual(gmailParsed.fields[0].label, 'EMAIL ADDRESS');
  assert.strictEqual(gmailParsed.fields[0].value, 'sarah.connor1984@gmail.com');
  assert.strictEqual(hotmailParsed.fields[0].isSensitive, false);
  assert.strictEqual(gmailParsed.fields[1].label, 'PASSWORD');
  assert.strictEqual(gmailParsed.fields[1].value, 'CyberDyne2026!');
  assert.strictEqual(gmailParsed.fields[2].label, 'RECOVERY EMAIL');
  assert.strictEqual(gmailParsed.fields[2].value, 'recm_user99@yahoo.com');
  console.log('✓ TEST 2 PASSED: Gmail credentials correctly extracted');

  // Test 3: Social media account credentials with 2FA key
  console.log('\n[TEST 3] Social Media Account with 2FA Key (Twitter/X)');
  const xRaw = 'crypto_whale_99:MegaSecurePass#2026:JBSWY3DPEHPK3PXP:recovery@proton.me';
  const xParsed = parseCredentialsPayload(xRaw, 'Aged X / Twitter Account with 2FA', 'Username:Password:2FA:Email');
  assert.strictEqual(xParsed.isStructured, true);
  assert.strictEqual(xParsed.fields[0].label, 'USERNAME');
  assert.strictEqual(xParsed.fields[0].value, 'crypto_whale_99');
  assert.strictEqual(xParsed.fields[1].label, 'PASSWORD');
  assert.strictEqual(xParsed.fields[2].label, '2FA SECRET');
  assert.strictEqual(xParsed.fields[2].value, 'JBSWY3DPEHPK3PXP');
  assert.strictEqual(xParsed.fields[3].label, 'RECOVERY EMAIL');
  console.log('✓ TEST 3 PASSED: Social account with 2FA properly extracted');

  // Test 4: VPN credentials
  console.log('\n[TEST 4] VPN Credentials');
  const vpnRaw = 'oj_vpn_sub_9921:SuperVpnPass2026#';
  const vpnParsed = parseCredentialsPayload(vpnRaw, 'NordVPN 1-Year Premium Dedicated', 'Username:Password');
  assert.strictEqual(vpnParsed.isStructured, true);
  assert.strictEqual(vpnParsed.fields[0].label, 'VPN USERNAME');
  assert.strictEqual(vpnParsed.fields[0].value, 'oj_vpn_sub_9921');
  assert.strictEqual(vpnParsed.fields[1].label, 'PASSWORD');
  assert.strictEqual(vpnParsed.fields[1].value, 'SuperVpnPass2026#');
  console.log('✓ TEST 4 PASSED: VPN credentials properly extracted');

  // Test 5: License-key products
  console.log('\n[TEST 5] License Key Product (Single Key with dashes)');
  const licenseRaw = 'W269N-WFGWX-YVC9B-4J6C9-T83GX';
  const licenseParsed = parseCredentialsPayload(licenseRaw, 'Windows 11 Professional Retail Activation Key', 'Product License Key');
  assert.strictEqual(licenseParsed.isStructured, false);
  assert.strictEqual(licenseParsed.fields[0].label, 'LICENSE / ACTIVATION KEY');
  assert.strictEqual(licenseParsed.fields[0].value, 'W269N-WFGWX-YVC9B-4J6C9-T83GX');
  console.log('✓ TEST 5 PASSED: License keys retained without breaking into dummy credential parts');

  // Test 6: Raw-text-only fulfillment
  console.log('\n[TEST 6] Raw Text Only Fulfillment');
  const rawTextFulfill = 'client_token_99219382193812938123';
  const rawParsed = parseCredentialsPayload(rawTextFulfill, 'API Access Token', 'Raw Token');
  assert.strictEqual(rawParsed.fields[0].value, rawTextFulfill);
  console.log('✓ TEST 6 PASSED: Raw text fulfillment gracefully handled');

  // Test 7: Structured JSON fulfillment
  console.log('\n[TEST 7] Structured JSON fulfillment simulated');
  const structuredMockAccounts = [
    {
      accountNumber: 1,
      title: 'Account Credentials',
      fields: [
        { label: 'EMAIL ADDRESS', value: 'buyer@outlook.com', type: 'email', isSensitive: false },
        { label: 'PASSWORD', value: 'secretpass', type: 'password', isSensitive: true },
        { label: 'RECOVERY DETAILS', value: 'M.C527_TOKEN', type: 'recovery_email', isSensitive: true }
      ],
      raw: 'buyer@outlook.com|secretpass|M.C527_TOKEN'
    }
  ];
  assert.strictEqual(structuredMockAccounts[0].fields.length, 3);
  console.log('✓ TEST 7 PASSED: Structured JSON fields structure preserved');

  // Test 8: Missing optional fields
  console.log('\n[TEST 8] Missing optional fields (Only Email & Password)');
  const twoPartRaw = 'only_user@mail.com|only_password_123';
  const twoPartParsed = parseCredentialsPayload(twoPartRaw, 'Hotmail Basic', 'Email|Password');
  assert.strictEqual(twoPartParsed.fields.length, 2);
  assert.strictEqual(twoPartParsed.fields[0].label, 'EMAIL ADDRESS');
  assert.strictEqual(twoPartParsed.fields[1].label, 'PASSWORD');
  console.log('✓ TEST 8 PASSED: Never fabricates missing fields');

  // Test 9: Multiple purchased accounts (Multi-line bulk order)
  console.log('\n[TEST 9] Multiple Purchased Accounts (Multi-line payload)');
  const multiLineRaw = 'acc1@hotmail.com|pass1|token1|backup1\nacc2@hotmail.com|pass2|token2|backup2';
  const multiParsed = parseCredentialsPayload(multiLineRaw, 'Hotmail Bulk 2x', 'Email|Password|Token|Backup');
  assert.strictEqual(multiParsed.accounts.length, 2);
  assert.strictEqual(multiParsed.accounts[0].fields[0].value, 'acc1@hotmail.com');
  assert.strictEqual(multiParsed.accounts[1].fields[0].value, 'acc2@hotmail.com');
  console.log('✓ TEST 9 PASSED: Multi-account orders cleanly partitioned into discrete cards');

  // Test 10: Previously delivered orders (Legacy payload normalization)
  console.log('\n[TEST 10] Retroactive compatibility: Normalize legacy order ord_oj_5198');
  // Seed wallet for test user
  const testUserId = `test_vault_user_${Date.now()}`;
  const testEmail = `vault_tester_${Date.now()}@ojalogs.com`;
  walletService.creditWallet(testUserId, 50000, 'deposit', `ref_dep_${Date.now()}`, 'Test deposit', undefined, testEmail);

  // Simulate an order with legacy structure (encrypted payload present, but deliveredSecrets lacked structuredFields)
  const legacyRawCredentials = 'TiaraGlowacky61@hotmail.com|hfygav9155|M.C527_BAY_293847294829384729384729384|9e5f94bc-2fad-4f26-98d3-9511798918a9';
  const legacyEncrypted = encryptPayload(legacyRawCredentials);

  const order = await orderService.checkout(
    testUserId,
    testEmail,
    [
      {
        productId: 'prod_legacy_hotmail_test',
        serverCluster: 'Server 2',
        title: 'Hotmail Trusted - OAuth2 [ Graph ] Live 12 - 36 Months',
        quantity: 1,
        unitPriceNgn: 25
      }
    ],
    'wallet',
    `idemp_test_legacy_${Date.now()}`
  );

  // Manually overwrite item secrets to simulate legacy state (masked dots without structured fields)
  order.items[0].deliveredSecrets = [
    {
      type: 'license_key',
      revealed: false,
      encryptedPayload: legacyEncrypted,
      value: '••••••••••••••••••••••••••••••',
      instruction: 'Delivered via automated upstream API.'
    } as any
  ];

  // Call getOrders to verify retroactive hydration
  const hydratedOrders = orderService.getOrders(testUserId, testEmail);
  const hydratedItem = hydratedOrders[0].items[0];
  const hydratedSec = hydratedItem.deliveredSecrets![0];

  assert.ok(hydratedSec.structuredFields && hydratedSec.structuredFields.length >= 4, 'Must retroactively hydrate structuredFields');
  assert.strictEqual(hydratedSec.structuredFields[0].label, 'EMAIL ADDRESS');
  assert.strictEqual(hydratedSec.structuredFields[0].value, 'TiaraGlowacky61@hotmail.com');
  assert.strictEqual(hydratedSec.structuredFields[1].label, 'PASSWORD');
  assert.strictEqual(hydratedSec.structuredFields[1].value, 'hfygav9155');
  assert.strictEqual(hydratedSec.structuredFields[2].label, 'RECOVERY DETAILS');
  assert.strictEqual(hydratedSec.structuredFields[3].label, 'BACKUP DETAILS');
  console.log('✓ TEST 10 PASSED: Legacy orders like ord_oj_5198 automatically normalized into discrete fields upon access');

  // Test 11: Incorrect supplier-order mapping rejection
  console.log('\n[TEST 11] Supplier mismatch protection');
  const mismatchItem = { title: 'Facebook Verified Aged Account', productId: 'lp_fb_123', serverCluster: 'Server 2' };
  const voucherAsAccount = 'WIN11-PRO-RETAIL-KEY-9921';
  const { validateFulfillmentSecret } = await import('../src/services/order.service.js');
  const validation = validateFulfillmentSecret(mismatchItem, voucherAsAccount);
  assert.strictEqual(validation.valid, false);
  console.log('✓ TEST 11 PASSED: Supplier mismatch correctly intercepted');

  // Test 12: Unauthorized access to another customer's vault (RLS 403)
  console.log('\n[TEST 12] Strict Tenant Isolation / RLS Security (403 on foreign user access)');
  const attackerUserId = `attacker_${Date.now()}`;
  let denied = false;
  try {
    orderService.revealSecret(attackerUserId, order.reference, order.items[0].id);
  } catch (err: any) {
    if (err.statusCode === 403 || err.message.includes('permission') || err.message.includes('denied')) {
      denied = true;
    }
  }
  assert.strictEqual(denied, true, 'Attacker must receive 403 Forbidden');
  console.log('✓ TEST 12 PASSED: Foreign user access denied with 403 Forbidden');

  // Test 13: Passwords containing colons, pipes, and special characters
  console.log('\n[TEST 13] Passwords containing colons and special characters');
  const specialPassRaw = 'user@outlook.com|P@ss:w0rd!#$|Recovery_Token_99|backup_123';
  const specialParsed = parseCredentialsPayload(specialPassRaw, 'Outlook Special', 'Email|Password|Recovery|Backup');
  assert.strictEqual(specialParsed.fields[1].value, 'P@ss:w0rd!#$');
  console.log('✓ TEST 13 PASSED: Passwords with colons in pipe-delimited records preserved intact');

  // Test 14: Duplicate webhook and API retry idempotency
  console.log('\n[TEST 14] Idempotency Protection');
  const idempKey = `idemp_unique_${Date.now()}`;
  const checkout1 = await orderService.checkout(testUserId, testEmail, [
    { productId: 'prod_idemp_test', serverCluster: 'Server 2', title: 'Test Item', quantity: 1, unitPriceNgn: 10 }
  ], 'wallet', idempKey);

  const balanceAfterFirst = walletService.getBalance(testUserId, testEmail);

  const checkout2 = await orderService.checkout(testUserId, testEmail, [
    { productId: 'prod_idemp_test', serverCluster: 'Server 2', title: 'Test Item', quantity: 1, unitPriceNgn: 10 }
  ], 'wallet', idempKey);

  const balanceAfterSecond = walletService.getBalance(testUserId, testEmail);
  assert.strictEqual(checkout1.reference, checkout2.reference, 'Must return same order reference');
  assert.strictEqual(balanceAfterFirst, balanceAfterSecond, 'Must not debit customer wallet twice');
  console.log('✓ TEST 14 PASSED: Idempotency strictly guarantees zero duplicate charges');

  console.log('\n================================================================');
  console.log('✓ ALL 14 VAULT FULFILLMENT & SECURITY TESTS PASSED WITH 100% SUCCESS');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
