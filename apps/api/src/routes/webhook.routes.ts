import { Router, Request, Response, NextFunction } from 'express';
import { bachGateway } from '../gateways/bach.gateway.js';
import { walletService } from '../services/wallet.service.js';
import { notificationService } from '../services/notification.service.js';
import { numbersService } from '../services/numbers.service.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// In-memory gateway event sink to enforce idempotency
const processedEvents = new Set<string>();

/**
 * Live / Sandbox Webhook Receiver from Bachs API
 */
router.post('/bach', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (
      req.headers['bachs-signature'] ||
      req.headers['x-bachs-signature-v2'] ||
      req.headers['x-bachs-signature'] ||
      req.headers['webhook-signature'] ||
      req.headers['svix-signature']
    ) as string;
    const timestamp = (
      req.headers['bachs-timestamp'] ||
      req.headers['x-bachs-timestamp'] ||
      req.headers['webhook-timestamp']
    ) as string;

    if (!signature) {
      throw new AppError('Missing Bachs-Signature / X-Bachs-Signature-V2 header', 400, 'MISSING_SIGNATURE');
    }

    // Capture exact raw body buffer preserved during express.json verification
    const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));

    // 1. Verify Signature & Anti-Replay Timestamp
    const webhookEvent = await bachGateway.handleWebhook(rawBody, signature, timestamp);

    // 2. Idempotency Check: Prevent Double Credit
    if (processedEvents.has(webhookEvent.eventId)) {
      console.log(`[BACH_WEBHOOK] Duplicate event ${webhookEvent.eventId} received. Skipping credit.`);
      return res.status(200).json({
        success: true,
        data: { received: true, duplicate: true, eventId: webhookEvent.eventId },
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
      });
    }

    processedEvents.add(webhookEvent.eventId);

    // 3. Process Valid Payment Event
    if (webhookEvent.status === 'successful' && webhookEvent.amountNgn > 0) {
      const payload = webhookEvent.rawPayload;
      const userId = payload.data?.metadata?.user_id || payload.metadata?.user_id || payload.data?.metadata?.userId || 'usr_oj_001';

      // Atomic Ledger Credit
      const tx = walletService.creditWallet(
        userId,
        webhookEvent.amountNgn,
        'deposit',
        webhookEvent.reference,
        `Bachs Gateway Verified Deposit (${webhookEvent.reference})`
      );

      console.log(`[BACH_WEBHOOK] Credited ₦${webhookEvent.amountNgn} to wallet for user ${userId}. Tx: ${tx.id}`);

      // Dispatch real-time deposit email alert to admin
      const customerEmail = payload.data?.customer_email || payload.data?.customer?.email || 'customer@ojalogs.com';
      notificationService.recordDepositAlert(
        userId,
        customerEmail,
        webhookEvent.amountNgn,
        webhookEvent.reference
      ).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      data: { received: true, processed: true, eventId: webhookEvent.eventId },
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Webhook Simulator (Allows immediate testing without needing a public domain yet!)
 */
router.post('/bach/simulate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountNgn = 25000, reference = `ref_oj_${Date.now()}`, eventType = 'collection.succeeded' } = req.body;

    const payload = {
      id: `evt_sim_${Date.now()}`,
      type: eventType,
      data: {
        reference,
        amount: amountNgn,
        currency: 'NGN',
        status: 'succeeded',
        metadata: {
          user_id: 'usr_oj_001'
        }
      }
    };

    const payloadStr = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = bachGateway.generateTestSignature(payloadStr, timestamp);

    // Trigger internal webhook validation with generated signature
    const event = await bachGateway.handleWebhook(payloadStr, signature, timestamp);

    // Idempotency check
    let isDuplicate = false;
    if (processedEvents.has(event.eventId)) {
      isDuplicate = true;
    } else {
      processedEvents.add(event.eventId);
      walletService.creditWallet(
        'usr_oj_001',
        event.amountNgn,
        'deposit',
        event.reference,
        `Bachs Simulated Webhook Deposit (${event.reference})`
      );
    }

    res.json({
      success: true,
      message: isDuplicate ? 'Event flagged as duplicate. Wallet not re-credited.' : 'Webhook simulated & verified successfully!',
      simulatedEvent: event,
      signatureUsed: signature,
      timestampUsed: timestamp,
      walletBalanceNow: walletService.getBalance('usr_oj_001'),
      isDuplicate
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Supabase Database / Auth Webhook: New User Registration Alert
 */
router.post(['/auth/new-user', '/auth', '/new-user'], async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    // Extract user info from Supabase Database Webhook payload
    const record = body.record || body;
    const email = record.email || body.email || 'customer@ojalogs.com';
    const metadata = record.raw_user_meta_data || record.user_metadata || {};
    const name = metadata.full_name || record.first_name || email.split('@')[0] || 'Customer';
    const createdAt = record.created_at || new Date().toISOString();

    console.log(`[SUPABASE_AUTH_WEBHOOK] 🚨 NEW USER REGISTERED on Ojalogs: ${email} (${name}) at ${createdAt}`);

    // Record user in admin store, create admin notification, and dispatch email alert to ojalogs@gmail.com
    await notificationService.recordSignupAlert(email, name, createdAt);

    return res.status(200).json({
      success: true,
      message: 'New user registration webhook processed successfully',
      data: { email, name, createdAt },
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    console.error('[SUPABASE_AUTH_WEBHOOK] Error handling new user webhook:', err);
    return res.status(200).json({ success: true, processed: false });
  }
});

/**
 * TextPlug Telephony Webhook: Real-Time Incoming SMS Receiver
 * Webhook URL: https://api.ojalogs.com.ng/api/v1/webhooks/textplug
 */
router.post(['/textplug', '/sms/textplug'], async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { serviceName, channel, phoneNumber, reference, code, message, text } = body;
    console.log(`[TEXTPLUG_WEBHOOK] 📩 Incoming SMS from TextPlug:`, { phoneNumber, reference, code, serviceName });

    const smsCode = code || (text ? (text.match(/\b\d{4,8}\b/) || [])[0] : '') || '';
    const fullText = message || text || `Your ${serviceName || 'verification'} code is ${smsCode}`;
    const sender = serviceName || 'TextPlug';

    const session = numbersService.findSessionByPhoneOrRef(reference || phoneNumber);
    if (session) {
      numbersService.receiveIncomingSms(session.id, sender, smsCode, fullText);
      console.log(`[TEXTPLUG_WEBHOOK] ✓ Successfully matched session ${session.id} (${session.phoneNumber}) with OTP code: ${smsCode}`);
    } else {
      console.warn(`[TEXTPLUG_WEBHOOK] No active session found for ref=${reference}, phone=${phoneNumber}. Recording in log.`);
    }

    return res.status(200).json({
      status: 'success',
      message: 'SMS received and processed successfully',
      matched: Boolean(session)
    });
  } catch (err: any) {
    console.error('[TEXTPLUG_WEBHOOK] Error processing TextPlug webhook:', err);
    return res.status(200).json({ status: 'error', message: err.message });
  }
});

export const webhookRouter = router;

