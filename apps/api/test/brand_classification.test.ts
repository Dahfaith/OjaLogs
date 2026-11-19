process.env.NODE_ENV = 'test';

import { resolveProductCategory } from '@ojalogs/shared';
import { resolveProductImage } from '../src/services/catalog.service.js';

console.log('\n======================================================');
console.log('🧪 RUNNING BRAND COVER BANNER & CLASSIFIER AUDIT SUITE');
console.log('======================================================\n');

function runClassifierTests() {
  let passedCount = 0;
  const assert = (condition: boolean, msg: string) => {
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`✅ PASS: ${msg}`);
    passedCount++;
  };

  console.log('--- 1. Social Media with Bundled Recovery Email (Facebook) ---');
  {
    const title = 'Facebook account with 2fa key hotmail email verified';
    const resolved = resolveProductCategory(title, 'Server 2');
    assert(resolved.categoryId === 'social-media', `Facebook with Hotmail classified as social-media (got ${resolved.categoryId})`);
    assert(resolved.category === 'Social Media Accounts', `Category name matches Social Media Accounts (got ${resolved.category})`);

    const image = resolveProductImage(title, resolved.categoryId, '');
    assert(image.includes('1611162618071-b39a2ec055fb'), `Authoritative image matches Facebook Unsplash photo`);
  }

  {
    const title = '1 page Facebook account with 2fa key Onet mail verified profile picture added 1 page';
    const resolved = resolveProductCategory(title, 'Facebook Accounts & BMs');
    assert(resolved.categoryId === 'social-media', `Facebook with Onet mail classified as social-media`);
  }

  console.log('\n--- 2. Social Media with Bundled Recovery Email (X / Twitter) ---');
  {
    const title = '"All-New X" 1-7+dya) | Outlook Email Long-Lived Token+2FA+ Token';
    const resolved = resolveProductCategory(title, 'Server 2');
    assert(resolved.categoryId === 'social-media', `All-New X with Outlook classified as social-media (got ${resolved.categoryId})`);

    const image = resolveProductImage(title, resolved.categoryId, '');
    assert(image.includes('1611605698335-8b1569810432'), `Authoritative image matches Twitter/X Unsplash photo`);
  }

  {
    const title = 'All-New X (1–7+ days) | Outlook Email Long-Lived Token+2FA+ Token';
    const resolved = resolveProductCategory(title, 'Server 2');
    assert(resolved.categoryId === 'social-media', `All-New X variant classified as social-media`);

    const image = resolveProductImage(title, resolved.categoryId, '');
    assert(image.includes('1611605698335-8b1569810432'), `Authoritative image matches Twitter/X Unsplash photo`);
  }

  {
    const title = '1 year old Twitter X accounts with high quality recovery mail included';
    const resolved = resolveProductCategory(title, 'Twitter / X Accounts');
    assert(resolved.categoryId === 'social-media', `Twitter X with recovery mail classified as social-media`);
  }

  console.log('\n--- 3. Pure Email Accounts (Must Preserve Email Category) ---');
  {
    const title = 'Outlook Email Accounts | 100% PVA Fresh';
    const resolved = resolveProductCategory(title, 'Server 2');
    assert(resolved.categoryId === 'email', `Pure Outlook PVA classified as email (got ${resolved.categoryId})`);
    assert(resolved.category === 'Email & Messaging Services', `Category name matches Email & Messaging Services`);

    const image = resolveProductImage(title, resolved.categoryId, '');
    assert(image.includes('1629654297299-c8506221ca97'), `Authoritative image matches Outlook Unsplash photo`);
  }

  {
    const title = 'Hotmail Fresh Accounts 2024 PVA';
    const resolved = resolveProductCategory(title, 'Server 2');
    assert(resolved.categoryId === 'email', `Pure Hotmail classified as email`);

    const image = resolveProductImage(title, resolved.categoryId, '');
    assert(image.includes('1629654297299-c8506221ca97'), `Authoritative image matches Hotmail Unsplash photo`);
  }

  {
    const title = 'Gmail Accounts PVA with App Password';
    const resolved = resolveProductCategory(title, 'Server 2');
    assert(resolved.categoryId === 'email', `Pure Gmail classified as email`);

    const image = resolveProductImage(title, resolved.categoryId, '');
    assert(image.includes('1596526131083-e8c633c948d2'), `Authoritative image matches Gmail Unsplash photo`);
  }

  console.log('\n--- 4. Prepaid & Gift Cards (Priority 1 Invariant) ---');
  {
    const title = 'Steam Wallet Gift Card $50 USD';
    const resolved = resolveProductCategory(title, 'Gift Cards');
    assert(resolved.categoryId === 'gift-cards', `Steam gift card classified as gift-cards`);
  }

  console.log('\n======================================================');
  console.log(`🏁 BRAND CLASSIFICATION AUDIT: ALL ${passedCount} CHECKS PASSED!`);
  console.log('======================================================\n');
}

runClassifierTests();
