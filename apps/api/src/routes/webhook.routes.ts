import { Router, Request, Response, NextFunction } from 'express';
import { bachGateway } from '../gateways/bach.gateway.js';
import { walletService } from '../services/wallet.service.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// In-memory gateway event sink to enforce idempotency
const processedEvents = new Set<string>();

/**
 * Live / Sandbox Webhook Receiver from Bachs API
 */
router.post('/bach', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-bachs-signature-v2'] as string;
    const timestamp = req.headers['x-bachs-timestamp'] as string;

    if (!signature) {
      throw new AppError('Missing X-Bachs-Signature-V2 header', 400, 'MISSING_SIGNATURE');
    }

    // Capture raw body
    const rawBody = JSON.stringify(req.body);

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
    if (webhookEvent.status === 'successful') {
      const userId = webhookEvent.rawPayload.data?.metadata?.user_id || 'usr_oj_001';

      // Atomic Ledger Credit
      const tx = walletService.creditWallet(
        userId,
        webhookEvent.amountNgn,
        'deposit',
        webhookEvent.reference,
        `Bachs Gateway Verified Deposit (${webhookEvent.reference})`
      );

      console.log(`[BACH_WEBHOOK] Credited ₦${webhookEvent.amountNgn} to wallet for user ${userId}. Tx: ${tx.id}`);
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

    // If Brevo API key exists, send an automated alert email to the admin
    const brevoApiKey = process.env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';

    if (brevoApiKey) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Ojalogs Marketplace Security', email: 'security@ojalogs.com' },
            to: [{ email: adminEmail, name: 'Ojalogs Operations Alert' }],
            subject: `🚨 New User Signup: ${email} on Ojalogs`,
            htmlContent: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Ojalogs Super Admin Alert</h2>
                </div>
                <h3 style="color: #0f172a; margin-top: 0;">A New Customer Just Registered!</h3>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  A new customer has just verified and created an account on your live marketplace platform.
                </p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Email:</strong> <span style="color: #0284c7; font-family: monospace;">${email}</span></p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Name:</strong> ${name}</p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Initial Wallet Balance:</strong> ₦0.00</p>
                  <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Registered At:</strong> ${new Date(createdAt).toUTCString()}</p>
                </div>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="https://ojalogs.vercel.app/admin" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Admin User Console →</a>
                </div>
              </div>
            `
          })
        });
        console.log(`[SUPABASE_AUTH_WEBHOOK] ✓ Dispatched notification email to ${adminEmail}`);
      } catch (mailErr: any) {
        console.warn(`[SUPABASE_AUTH_WEBHOOK] Brevo alert email notice: ${mailErr.message}`);
      }
    }

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

export const webhookRouter = router;

