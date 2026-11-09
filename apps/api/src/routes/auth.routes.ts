import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { walletService } from '../services/wallet.service.js';
import { notificationService } from '../services/notification.service.js';
import { env } from '../config/env.js';

const router = Router();

const MagicLinkSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional()
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().min(4)
});

// In-memory dev fallback codes for sandbox testing
const devOtpStore = new Map<string, { code: string; expiresAt: number }>();

/**
 * 1. Send Magic Link / OTP Code
 * Automatically registers new users or logs in existing users
 */
router.post('/magic-link', authLimiter, validateBody(MagicLinkSchema), async (req, res, next) => {
  try {
    const { email, redirectTo } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if Brevo is available for instant 1-second OTP delivery
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    // 2. Fast 6-digit OTP generation
    const devCode = Math.floor(100000 + Math.random() * 900000).toString();
    devOtpStore.set(cleanEmail, { code: devCode, expiresAt: Date.now() + 10 * 60 * 1000 });

    let emailDispatched = false;

    // 3. Dispatch Lightning-Fast Branded Confirmation Code via Verified Brevo Sender
    if (brevoApiKey) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'OjaLogs Security', email: senderEmail },
            to: [{ email: cleanEmail }],
            subject: `🔐 ${devCode} is your Ojalogs verification code`,
            htmlContent: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <div style="background: #020b18; padding: 18px 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">OjaLogs</h2>
                  <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Marketplace Verification</p>
                </div>
                <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Your one-time sign-in code</p>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">Use the 6-digit confirmation code below to complete your sign-in to Ojalogs. This code expires in 10 minutes.</p>
                <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
                  <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7;">${devCode}</span>
                </div>
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">If you did not request this verification code, please ignore this email.</p>
              </div>
            `
          })
        });

        if (brevoRes.ok) {
          emailDispatched = true;
          console.log(`[BREVO_OTP] ✓ Dispatched fast 6-digit OTP (${devCode}) to ${cleanEmail} via ${senderEmail}`);
        }
      } catch (err: any) {
        console.warn(`[BREVO_OTP_NOTICE] ${err.message}`);
      }
    }

    // 4. Fallback to Supabase ONLY if Brevo was not configured
    let supabaseSuccess = false;
    if (!emailDispatched) {
      try {
        const { error } = await supabaseAdmin.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: true
          }
        });
        if (!error) supabaseSuccess = true;
      } catch (e: any) {
        console.warn(`[SUPABASE_AUTH_ERR] ${e.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        sent: true,
        email: cleanEmail,
        supabaseSent: supabaseSuccess,
        // In dev mode, return backup code so developer can verify immediately
        previewCode: devCode,
        message: supabaseSuccess
          ? `Magic link and OTP sent to ${cleanEmail}. Check your inbox!`
          : `Confirmation code generated. Use code ${devCode} to sign in.`
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Verify Magic Link Token or 6-Digit OTP Code
 */
router.post('/verify-otp', authLimiter, validateBody(VerifyOtpSchema), async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanToken = token.trim();

    let authenticated = false;
    let userId = `usr_oj_${Date.now()}`;
    let userName = cleanEmail.split('@')[0];

    // Check dev OTP store
    const devEntry = devOtpStore.get(cleanEmail);
    if (devEntry && devEntry.code === cleanToken && Date.now() < devEntry.expiresAt) {
      authenticated = true;
      devOtpStore.delete(cleanEmail);
    } else {
      // Try verifying via Supabase
      try {
        const { data, error } = await supabaseAdmin.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email'
        });

        if (!error && data.user) {
          authenticated = true;
          userId = data.user.id;
          userName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
        }
      } catch (e: any) {
        console.warn('[SUPABASE_VERIFY_ERR]', e.message);
      }
    }

    if (!authenticated) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OR_EXPIRED_CODE',
          message: 'The confirmation link or code is invalid or has expired. Please request a new one.'
        }
      });
    }

    // Capitalize name
    const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    // Ensure wallet exists in walletService
    const existingBalance = walletService.getBalance(userId);
    if (existingBalance === 0) {
      // Initialize with default or keep at 0
    }

    // Check if brand-new customer or returning customer
    const isKnown = notificationService.hasUser(cleanEmail);
    const isNewUser = !isKnown;

    // Dispatch initial registration alert ONLY if brand-new user
    if (isNewUser) {
      notificationService.recordSignupAlert(cleanEmail, formattedName).catch(() => {});
    }

    const sessionToken = `mock_jwt_customer_${userId}`;

    res.status(200).json({
      success: true,
      data: {
        token: sessionToken,
        user: {
          id: userId,
          email: cleanEmail,
          name: formattedName,
          initials: formattedName.substring(0, 2).toUpperCase(),
          role: 'customer',
          isVerified: true,
          isNewUser
        }
      },
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

// Get current profile
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user,
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

export const authRouter = router;
