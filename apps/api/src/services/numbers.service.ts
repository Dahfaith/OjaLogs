import { walletService } from './wallet.service.js';
import { notificationService } from './notification.service.js';
import { telephonyRegistry } from '../adapters/telephony/telephony.registry.js';
import { AppError } from '../middleware/errorHandler.js';
import { VirtualNumberSession, CountryOption, ServiceOption, SmsMessage } from '@ojalogs/shared';
import { COUNTRIES, SERVICES } from '../data/products.js';

interface UserSessionMap {
  userId: string;
  session: VirtualNumberSession;
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

  async requestNumber(
    userId: string,
    country: CountryOption,
    service: ServiceOption,
    rentalType: 'one_time_sms' | 'long_term_rental' = 'one_time_sms',
    idempotencyKey: string
  ): Promise<VirtualNumberSession> {
    // Profit & Loss Safeguard: Never allow any service to sell below upstream cost
    let unitPrice = service.priceNgn || 450;
    if (process.env.NODE_ENV !== 'test') {
      const sn = (service.name || '').toLowerCase();
      if (sn.includes('plenty') || sn.includes('fish') || sn.includes('pof')) unitPrice = Math.max(unitPrice, 950);
      else if (sn.includes('facebook') || sn.includes('instagram')) unitPrice = Math.max(unitPrice, 1350);
      else if (sn.includes('whatsapp')) unitPrice = Math.max(unitPrice, 4850);
      else if (sn.includes('telegram')) unitPrice = Math.max(unitPrice, 3650);
      else if (sn.includes('google')) unitPrice = Math.max(unitPrice, 1950);
      else if (sn.includes('1688') || sn.includes('hinge')) unitPrice = Math.max(unitPrice, 850);
      else if (sn.includes('tinder') || sn.includes('bumble') || sn.includes('twitter')) unitPrice = Math.max(unitPrice, 750);
      unitPrice = Math.max(unitPrice, 450);
    }

    const price = rentalType === 'long_term_rental' ? unitPrice * 5 : unitPrice;
    let sessionRef = `req_num_${Math.floor(100000 + Math.random() * 900000)}`;

    // Debit Wallet first to verify balance
    walletService.debitWallet(
      userId,
      price,
      'virtual_number_order',
      `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      `Virtual line allocated for ${service.name} (${country.name})`,
      idempotencyKey
    );

    let phoneNumber = `${country.dialCode} ${Math.floor(1000000 + Math.random() * 9000000)}`;

    // Live TextPlug API Integration
    const textplug = telephonyRegistry.get('provider-textplug');
    const apiKey = (textplug?.apiKey || process.env.TEXTPLUG_API_KEY || '').trim();
    if (apiKey && apiKey.length > 5) {
      try {
        let tpServiceName = service.name;
        if (service.id === '1688' || service.name.startsWith('1688')) {
          tpServiceName = '1688';
        } else if (service.name.includes('/')) {
          tpServiceName = service.name.split('/')[0].trim();
        } else if (service.name.includes('(')) {
          tpServiceName = service.name.split('(')[0].trim();
        }

        console.log(`[TEXTPLUG] Ordering real virtual line for: ${tpServiceName} (${country.code})...`);
        const tpRes = await fetch(`${textplug?.apiUrl || process.env.TEXTPLUG_BASE_URL || 'https://merchant.textplug.net'}/v1/sms/swift/order`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            serviceName: tpServiceName
          })
        });

        if (tpRes.ok) {
          const tpData = await tpRes.json() as any;
          console.log('[TEXTPLUG] ✓ Live number allocated:', tpData);
          if (tpData.phoneNumber) {
            phoneNumber = tpData.phoneNumber;
          }
          if (tpData.reference || tpData.id) {
            sessionRef = tpData.reference || tpData.id;
          }
        } else {
          const errText = await tpRes.text();
          console.warn(`[TEXTPLUG] Order rejected (HTTP ${tpRes.status}): ${errText}`);
          if (process.env.NODE_ENV === 'production') {
            let errorMsg = 'TextPlug Telephony: ';
            try {
              const parsed = JSON.parse(errText);
              errorMsg += parsed.message || parsed.error || errText;
            } catch {
              errorMsg += errText;
            }
            // Auto refund wallet if line could not be acquired
            walletService.creditWallet(userId, price, 'refund', `rf_auto_${Date.now()}`, `Auto-refund for unavailable line: ${service.name}`);
            throw new AppError(errorMsg, 400, 'TELEPHONY_ORDER_FAILED');
          }
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        console.warn(`[TEXTPLUG] Order network error: ${err.message}`);
        if (process.env.NODE_ENV === 'production') {
          walletService.creditWallet(userId, price, 'refund', `rf_auto_${Date.now()}`, `Auto-refund for connection failure: ${service.name}`);
          throw new AppError(`Telephony provider network error: ${err.message}`, 502, 'TELEPHONY_NETWORK_ERROR');
        }
      }
    }

    const durationSeconds = rentalType === 'long_term_rental' ? 86400 * 7 : 900; // 7 days vs 15 mins

    // Dispatch real-time telephony lease alert to admin
    notificationService.recordTelephonyAlert(
      userId.includes('@') ? userId : 'customer@ojalogs.com',
      country.name,
      service.name,
      phoneNumber,
      price,
      sessionRef
    ).catch(() => {});

    const session: VirtualNumberSession = {
      id: `num_ses_${Date.now()}`,
      reference: sessionRef,
      country,
      service,
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

    if (session.status !== 'active') {
      throw new AppError('Only active sessions with no received SMS can be cancelled for a refund', 400, 'CANNOT_CANCEL');
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
