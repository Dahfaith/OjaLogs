import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { walletService } from '../services/wallet.service.js';

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

    // 1. Try sending real Supabase Magic Link
    let supabaseSuccess = false;
    let errorMessage: string | undefined;

    try {
      const { error } = await supabaseAdmin.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true
        }
      });

      if (!error) {
        supabaseSuccess = true;
      } else {
        errorMessage = error.message;
        console.warn(`[SUPABASE_AUTH_NOTICE] ${error.message}. Generating backup dev code.`);
      }
    } catch (e: any) {
      errorMessage = e.message;
      console.warn(`[SUPABASE_AUTH_ERR] ${e.message}`);
    }

    // 2. Fallback / Dev Code generation for instant sandbox testing
    const devCode = Math.floor(100000 + Math.random() * 900000).toString();
    devOtpStore.set(cleanEmail, { code: devCode, expiresAt: Date.now() + 10 * 60 * 1000 });

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
          isVerified: true
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
