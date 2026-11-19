import { walletService } from './wallet.service.js';
import { notificationService } from './notification.service.js';
import { telephonyRegistry } from '../adapters/telephony/telephony.registry.js';
import { AppError } from '../middleware/errorHandler.js';
import { VirtualNumberSession, CountryOption, ServiceOption, SmsMessage, getServicePriceForCountry } from '@ojalogs/shared';
import { COUNTRIES, SERVICES } from '../data/products.js';

interface UserSessionMap {
  userId: string;
  session: VirtualNumberSession;
}

/**
 * Generates a full-length, valid national format phone number for the specified country.
 * Prevents incomplete 7-digit numbers by ensuring complete area code + subscriber length.
 */
export function generateCompletePhoneNumber(dialCode: string, countryCode: string = 'US'): string {
  const code = (countryCode || 'US').toUpperCase();
  const randDigit = (min = 0, max = 9) => Math.floor(min + Math.random() * (max - min + 1));
  const randSeq = (len: number) => Array.from({ length: len }, () => randDigit()).join('');

  if (code === 'US' || code === 'CA' || dialCode === '+1') {
    // North American Numbering Plan: full 10 digits (3-digit Area Code + 3-digit Office Code + 4-digit Line Number)
    const areaCodes = [
      '202', '212', '213', '312', '347', '415', '510', '567', '617', '646',
      '702', '718', '737', '832', '917', '929', '408', '650', '323', '416'
    ];
    const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const centralOffice = `${randDigit(2, 9)}${randSeq(2)}`;
    const lineNum = randSeq(4);
    return `+1 ${area} ${centralOffice} ${lineNum}`;
  }

  if (code === 'GB' || dialCode === '+44') {
    // UK Mobile: full 10 digits starting with 7
    const prefix = ['7911', '7400', '7700', '7800', '7900', '7950'][Math.floor(Math.random() * 6)];
    return `+44 ${prefix} ${randSeq(6)}`;
  }

  if (code === 'NG' || dialCode === '+234') {
    // Nigeria Mobile: full 10 digits starting with 80, 81, 90, 70
    const prefix = ['803', '806', '810', '813', '814', '816', '903', '906', '703', '706'][Math.floor(Math.random() * 10)];
    return `+234 ${prefix} ${randSeq(7)}`;
  }

  if (code === 'DE' || dialCode === '+49') {
    // Germany Mobile: full 10 digits starting with 15, 16, 17
    const prefix = ['151', '160', '170', '171', '175', '176'][Math.floor(Math.random() * 6)];
    return `+49 ${prefix} ${randSeq(7)}`;
  }

  if (code === 'FR' || dialCode === '+33') {
    // France Mobile: full 9 digits starting with 6 or 7
    const prefix = ['6', '7'][Math.floor(Math.random() * 2)];
    return `+33 ${prefix} ${randSeq(8)}`;
  }

  if (code === 'NL' || dialCode === '+31') {
    // Netherlands Mobile: full 9 digits starting with 6
    return `+31 6 ${randSeq(8)}`;
  }

  // Universal international standard: dialCode + 10 digits
  return `${dialCode} ${randDigit(2, 9)}${randSeq(9)}`;
}

/**
 * Normalizes and formats incoming phone number from upstream provider into full standard format.
 */
export function formatFullPhoneNumber(raw: string, countryCode: string = 'US', dialCode: string = '+1'): string {
  if (!raw) return generateCompletePhoneNumber(dialCode, countryCode);
  const cleaned = raw.trim();

  // If already starts with '+', format cleanly with area code
  if (cleaned.startsWith('+')) {
    const digits = cleaned.replace(/\D/g, '');
    if ((countryCode === 'US' || dialCode === '+1') && digits.length === 11 && digits.startsWith('1')) {
      return `+1 ${digits.substring(1, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
    }
    return cleaned;
  }

  // If bare 11 digits starting with 1 for US/CA
  const digits = cleaned.replace(/\D/g, '');
  if ((countryCode === 'US' || dialCode === '+1') && digits.length === 11 && digits.startsWith('1')) {
    return `+1 ${digits.substring(1, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }
  if ((countryCode === 'US' || dialCode === '+1') && digits.length === 10) {
    return `+1 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
  }

  return `${dialCode} ${digits}`;
}

export class NumbersService {
  private sessions = new Map<string, UserSessionMap>();

  private liveServicesCache: ServiceOption[] | null = null;

  getCountries(): CountryOption[] {
    return COUNTRIES;
  }

  getServices(): ServiceOption[] {
    return this.liveServicesCache || SERVICES;
  }

  async refreshServices(): Promise<ServiceOption[]> {
    try {
      const live = await telephonyRegistry.fetchLiveServices('provider-textplug');
      if (live && live.length > 0) {
        const map = new Map<string, ServiceOption>();
        // First populate with live services
        for (const item of live) {
          const idKey = item.id.toLowerCase().trim();
          const nameKey = item.name.toLowerCase().trim();
          map.set(idKey, item);
          map.set(nameKey, item);
        }
        // Then add fallback SERVICES only if not present in live
        const merged: ServiceOption[] = [...live];
        for (const item of SERVICES) {
          const idKey = item.id.toLowerCase().trim();
          const nameKey = item.name.toLowerCase().trim();
          if (!map.has(idKey) && !map.has(nameKey)) {
            map.set(idKey, item);
            merged.push(item);
          }
        }
        this.liveServicesCache = merged;
        return merged;
      }
    } catch (err: any) {
      console.warn(`[NUMBERS_SERVICES] Live query notice: ${err.message}`);
    }
    return SERVICES;
  }

  getUserSessions(userId: string): VirtualNumberSession[] {
    const list: VirtualNumberSession[] = [];
    for (const item of this.sessions.values()) {
      if (item.userId === userId) {
        list.push(item.session);
      }
    }
    return list.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  }

  getSession(sessionId: string): VirtualNumberSession | undefined {
    return this.sessions.get(sessionId)?.session;
  }

  findSessionByPhoneOrRef(phoneOrRef: string): VirtualNumberSession | undefined {
    if (!phoneOrRef) return undefined;
    const cleanTarget = phoneOrRef.replace(/\D/g, '');
    for (const item of this.sessions.values()) {
      const cleanPhone = item.session.phoneNumber.replace(/\D/g, '');
      if (
        item.session.reference === phoneOrRef ||
        item.session.id === phoneOrRef ||
        (cleanTarget.length > 5 && (cleanPhone === cleanTarget || cleanPhone.endsWith(cleanTarget) || cleanTarget.endsWith(cleanPhone)))
      ) {
        return item.session;
      }
    }
    return undefined;
  }

  getActiveSessionsCount(): number {
    let count = 0;
    for (const item of this.sessions.values()) {
      if (item.session.status === 'active') count++;
    }
    return count;
  }

  /**
   * Authoritative lookup of a service across live and cached catalog.
   * Handles semantic mapping (e.g. 'twitter' <-> 'x-twitter' <-> 'X.com / Twitter').
   */
  findService(serviceIdOrName: string): ServiceOption | undefined {
    if (!serviceIdOrName) return undefined;
    const all = this.getServices();
    const target = serviceIdOrName.trim().toLowerCase();
    const cleanTarget = target.replace(/[^a-z0-9]/g, '');

    // 1. Exact ID match
    let match = all.find(s => s.id.toLowerCase() === target);
    if (match) return match;

    // 2. Exact Name match
    match = all.find(s => s.name.toLowerCase() === target);
    if (match) return match;

    // 3. Clean alphanumeric match on ID
    match = all.find(s => s.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
    if (match) return match;

    // 4. Clean alphanumeric match on Name
    match = all.find(s => s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
    if (match) return match;

    // 5. Semantic / Brand match (e.g. 'twitter' or 'x-twitter' or 'x.com')
    if (target.includes('twitter') || target === 'x' || target.includes('x.com') || target === 'x-twitter') {
      match = all.find(s => {
        const sn = s.name.toLowerCase();
        const sid = s.id.toLowerCase();
        return sn.includes('twitter') || sid.includes('twitter') || sid === 'x-twitter' || sn.includes('x.com');
      });
      if (match) return match;
    }

    if (target.includes('whatsapp')) {
      match = all.find(s => s.name.toLowerCase().includes('whatsapp') || s.id.toLowerCase().includes('whatsapp'));
      if (match) return match;
    }

    if (target.includes('telegram')) {
      match = all.find(s => s.name.toLowerCase().includes('telegram') || s.id.toLowerCase().includes('telegram'));
      if (match) return match;
    }

    // 6. Substring match
    match = all.find(s => s.name.toLowerCase().includes(target) || s.id.toLowerCase().includes(target));
    if (match) return match;

    return undefined;
  }

  /**
   * Authoritative server-side pricing engine for any service, country, and rental type.
   * Guarantees Single Source of Truth for both quotes and checkout execution.
   */
  calculateAuthoritativePrice(
    serviceIdOrName: string,
    countryCode: string = 'US',
    rentalType: 'one_time_sms' | 'long_term_rental' = 'one_time_sms'
  ): {
    service: ServiceOption;
    country: CountryOption;
    unitPriceNgn: number;
    totalPriceNgn: number;
    currency: 'NGN';
  } {
    const service = this.findService(serviceIdOrName);
    if (!service) {
      throw new AppError(`Virtual number service "${serviceIdOrName}" is not available. Please choose a listed service.`, 404, 'SERVICE_NOT_FOUND');
    }

    const country = this.getCountries().find(c => c.code.toUpperCase() === (countryCode || 'US').toUpperCase()) ||
      this.getCountries()[0] ||
      { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', availableNumbers: 100 };

    const unitPriceNgn = getServicePriceForCountry(service, country.code, 'one_time_sms');
    const totalPriceNgn = rentalType === 'long_term_rental' ? unitPriceNgn * 5 : unitPriceNgn;

    return {
      service,
      country,
      unitPriceNgn,
      totalPriceNgn,
      currency: 'NGN'
    };
  }

  async requestNumber(
    userId: string,
    country: CountryOption,
    service: ServiceOption,
    rentalType: 'one_time_sms' | 'long_term_rental' = 'one_time_sms',
    idempotencyKey: string,
    expectedPrice?: number
  ): Promise<VirtualNumberSession> {
    // 1. Authoritative Pricing Calculation (Single Source of Truth)
    let price: number;
    let effectiveService = service;
    let effectiveCountry = country;

    try {
      const quote = this.calculateAuthoritativePrice(service.id || service.name, country.code, rentalType);
      effectiveService = quote.service;
      effectiveCountry = quote.country;
      price = quote.totalPriceNgn;
    } catch (qErr) {
      // Fallback calculation using shared authoritative math
      const unitPrice = getServicePriceForCountry(service, country.code);
      price = rentalType === 'long_term_rental' ? unitPrice * 5 : unitPrice;
    }

    // 2. Checkout Protection: Prevent silent charges or stale price drift
    if (typeof expectedPrice === 'number' && expectedPrice > 0 && Math.abs(expectedPrice - price) > 0) {
      throw new AppError(
        `The price for ${effectiveService.name} (${effectiveCountry.name}) has updated to ₦${price.toLocaleString()} (was ₦${expectedPrice.toLocaleString()}). Please confirm the new rate.`,
        409,
        'PRICE_CHANGED'
      );
    }

    let sessionRef = `req_num_${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Pre-flight balance verification (Fail before contacting telephony provider)
    const currentBalance = walletService.getBalance(userId);
    if (currentBalance < price) {
      throw new AppError(
        `Insufficient wallet balance. Required: ₦${price.toLocaleString()}, Available: ₦${currentBalance.toLocaleString()}. Please fund your wallet.`,
        400,
        'INSUFFICIENT_FUNDS'
      );
    }

    let phoneNumber = generateCompletePhoneNumber(effectiveCountry.dialCode, effectiveCountry.code);

    // Live TextPlug API Integration
    const textplug = telephonyRegistry.get('provider-textplug');
    const apiKey = (textplug?.apiKey || process.env.TEXTPLUG_API_KEY || '').trim();
    if (apiKey && apiKey.length > 5 && process.env.NODE_ENV !== 'test') {
      try {
        let tpServiceName = effectiveService.name || service.name;
        if (effectiveService.id === '1688' || effectiveService.name.startsWith('1688')) {
          tpServiceName = '1688';
        } else if (effectiveService.id === 'x-twitter' || effectiveService.name.toLowerCase().includes('twitter')) {
          tpServiceName = 'X.com / Twitter';
        } else if (effectiveService.name.includes('/')) {
          tpServiceName = effectiveService.name.split('/')[0].trim();
        } else if (effectiveService.name.includes('(')) {
          tpServiceName = effectiveService.name.split('(')[0].trim();
        }

        console.log(`[TEXTPLUG] Ordering real virtual line for: ${tpServiceName} (ID: ${effectiveService.id}, Country: ${effectiveCountry.code})...`);
        const tpRes = await fetch(`${textplug?.apiUrl || process.env.TEXTPLUG_BASE_URL || 'https://merchant.textplug.net'}/v1/sms/swift/order`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            serviceId: effectiveService.id,
            serviceName: tpServiceName,
            country: effectiveCountry.code,
            countryCode: effectiveCountry.code
          })
        });

        const tpData = (await tpRes.json().catch(() => null)) as any;

        if (!tpRes.ok || !tpData || tpData.error === true || tpData.success === false) {
          const errMsg = tpData?.message || tpData?.error || `Telephony order rejected with HTTP ${tpRes.status}`;
          console.warn(`[TEXTPLUG] Order rejected:`, errMsg);
          throw new AppError(`TextPlug Telephony: ${errMsg}. Your wallet was NOT charged.`, 400, 'TELEPHONY_ORDER_FAILED');
        }

        console.log('[TEXTPLUG] ✓ Live number allocated:', tpData);
        const payload = tpData.data || tpData;
        const rawPhone = payload.phoneNumber || payload.phone || payload.number || tpData.phoneNumber;
        const rawRef = payload.reference || payload.orderId || payload.id || tpData.reference || tpData.id;

        if (!rawPhone) {
          console.warn('[TEXTPLUG] Upstream response missing phone number:', tpData);
          throw new AppError('Telephony provider did not return an active line. Your wallet was NOT charged.', 400, 'TELEPHONY_NO_NUMBER');
        }

        phoneNumber = formatFullPhoneNumber(rawPhone, effectiveCountry.code, effectiveCountry.dialCode);
        if (rawRef) {
          sessionRef = String(rawRef);
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        console.warn(`[TEXTPLUG] Order network error: ${err.message}`);
        throw new AppError(`Telephony provider network error: ${err.message}. Your wallet was NOT charged.`, 502, 'TELEPHONY_NETWORK_ERROR');
      }
    }

    // Debit Wallet only after telephony provider confirms line allocation
    walletService.debitWallet(
      userId,
      price,
      'virtual_number_order',
      `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      `Virtual line allocated for ${effectiveService.name} (${effectiveCountry.name})`,
      idempotencyKey
    );

    const durationSeconds = rentalType === 'long_term_rental' ? 86400 * 7 : 900; // 7 days vs 15 mins

    // Dispatch real-time telephony lease alert to admin
    notificationService.recordTelephonyAlert(
      userId.includes('@') ? userId : 'customer@ojalogs.com',
      effectiveCountry.name,
      effectiveService.name,
      phoneNumber,
      price,
      sessionRef
    ).catch(() => {});

    const session: VirtualNumberSession = {
      id: `num_ses_${Date.now()}`,
      reference: sessionRef,
      country: effectiveCountry,
      service: effectiveService,
      phoneNumber,
      rentalType,
      status: 'active',
      timeRemainingSeconds: durationSeconds,
      expiresAt: new Date(Date.now() + durationSeconds * 1000).toISOString(),
      priceNgn: price,
      canCancel: true,
      canRenew: rentalType === 'long_term_rental',
      messages: []
    };

    this.sessions.set(session.id, { userId, session });
    return session;
  }

  async cancelAndRefund(userId: string, sessionId: string) {
    const item = this.sessions.get(sessionId);
    if (!item) {
      throw new AppError('Virtual number session not found', 404, 'SESSION_NOT_FOUND');
    }

    const { session } = item;
    if (item.userId !== userId) {
      throw new AppError('Unauthorized access to this session', 403, 'FORBIDDEN');
    }

    if (session.status !== 'active' || (session.messages && session.messages.length > 0) || !session.canCancel) {
      throw new AppError('This session has already delivered verification SMS codes or is not eligible for cancellation. Non-refundable.', 400, 'CANNOT_CANCEL');
    }

    const refundAmount = session.priceNgn;
    const refundRef = `ref_rf_${Math.floor(100000 + Math.random() * 900000)}`;

    walletService.creditWallet(
      userId,
      refundAmount,
      'refund',
      refundRef,
      `Cancelled virtual number allocation (${session.phoneNumber})`
    );

    // If live TextPlug session, notify provider to release number
    const textplug = telephonyRegistry.get('provider-textplug');
    if (textplug && textplug.apiKey && session.reference && (session.reference.includes('-') || session.reference.startsWith('tp_'))) {
      fetch(`${textplug.apiUrl || 'https://merchant.textplug.net'}/v1/sms/swift/cancel/${session.reference}`, {
        method: 'POST',
        headers: {
          'x-api-key': textplug.apiKey.trim(),
          'Accept': 'application/json'
        }
      }).catch(err => console.warn('[TEXTPLUG_CANCEL] Notice:', err.message));
    }

    session.status = 'cancelled';
    session.canCancel = false;

    // Dispatch real-time refund alert to admin
    notificationService.recordRefundAlert(
      userId.includes('@') ? userId : 'customer@ojalogs.com',
      refundAmount,
      refundRef,
      `Cancelled virtual number allocation (${session.phoneNumber})`
    ).catch(() => {});

    return {
      cancelled: true,
      refundedAmount: refundAmount,
      refundReference: refundRef
    };
  }

  receiveIncomingSms(sessionId: string, sender: string, code: string, fullText: string): SmsMessage {
    const item = this.sessions.get(sessionId);
    if (!item) {
      throw new AppError('Virtual number session not found', 404, 'SESSION_NOT_FOUND');
    }

    const { session } = item;
    const msg: SmsMessage = {
      id: `sms_${Date.now()}`,
      sender,
      code,
      fullText,
      receivedAt: new Date().toISOString()
    };

    session.status = 'sms_received';
    session.canCancel = false;
    session.messages.unshift(msg);

    return msg;
  }

  simulateIncomingSms(sessionId: string, sender: string = 'VERIFY', code?: string): SmsMessage {
    const generatedCode = code || Math.floor(100000 + Math.random() * 900000).toString();
    const fullText = `Your Ojalogs verification code is ${generatedCode}. Valid for 10 minutes. Never share this code.`;
    return this.receiveIncomingSms(sessionId, sender, generatedCode, fullText);
  }

  async renewRental(userId: string, sessionId: string, idempotencyKey?: string): Promise<VirtualNumberSession> {
    const item = this.sessions.get(sessionId);
    if (!item) {
      throw new AppError('Virtual number session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (item.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const { session } = item;
    if (session.rentalType !== 'long_term_rental') {
      throw new AppError('Only long-term rentals can be renewed', 400, 'NOT_RENEWABLE');
    }

    const renewalPrice = session.priceNgn;
    walletService.debitWallet(
      userId,
      renewalPrice,
      'virtual_number_order',
      `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      `Renewal of line ${session.phoneNumber} for 7 additional days`,
      idempotencyKey
    );

    const additionalMs = 86400 * 7 * 1000;
    const currentExpiry = new Date(session.expiresAt).getTime();
    const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + additionalMs);
    session.expiresAt = newExpiry.toISOString();
    session.status = 'active';

    return session;
  }

  /**
   * Automated 100% refund processor (called by cron every minute)
   * Finds any active session where expiresAt has elapsed and no SMS was received,
   * marks as 'refunded', and credits 100% refund to customer's wallet!
   */
  async reconcileExpiredRentals(): Promise<{ expiredCount: number; totalRefundedNgn: number }> {
    const now = Date.now();
    let expiredCount = 0;
    let totalRefundedNgn = 0;

    for (const { userId, session } of this.sessions.values()) {
      if (session.status === 'active') {
        const expiry = new Date(session.expiresAt).getTime();
        if (expiry <= now) {
          // Time expired with zero SMS received -> Automated 100% refund
          const refundAmount = session.priceNgn;
          const refundRef = `ref_rf_${Math.floor(100000 + Math.random() * 900000)}`;

          walletService.creditWallet(
            userId,
            refundAmount,
            'refund',
            refundRef,
            `Automated 100% refund for expired SMS session (${session.phoneNumber})`
          );

          session.status = 'refunded';
          session.canCancel = false;
          session.timeRemainingSeconds = 0;

          expiredCount++;
          totalRefundedNgn += refundAmount;
        }
      }
    }

    return { expiredCount, totalRefundedNgn };
  }
}

export const numbersService = new NumbersService();
