import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { moneyLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { walletService } from '../services/wallet.service.js';
import { FundWalletInputSchema } from '@ojalogs/shared';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

router.get('/balance', (req, res) => {
  const balance = walletService.getBalance(req.user!.id);
  res.json({
    success: true,
    data: { balanceNgn: balance, currency: 'NGN' },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.get('/ledger', (req, res) => {
  const filter = req.query.category as string | undefined;
  const ledger = walletService.getLedger(req.user!.id, filter);
  res.json({
    success: true,
    data: { transactions: ledger, count: ledger.length },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.post(
  '/fund',
  moneyLimiter,
  idempotencyMiddleware,
  validateBody(FundWalletInputSchema),
  async (req, res, next) => {
    try {
      const { amountNgn, idempotencyKey } = req.body;
      const result = await walletService.initiateFunding(
        req.user?.id || 'usr_customer_01',
        amountNgn,
        req.user?.email || 'customer@ojalogs.com',
        idempotencyKey
      );

      res.status(201).json({
        success: true,
        data: result,
        meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
      });
    } catch (err) {
      next(err);
    }
  }
);

const VerifyFundSchema = z.object({
  paymentReference: z.string().min(1),
  gatewayReference: z.string().min(1)
});

router.post('/verify-fund', moneyLimiter, validateBody(VerifyFundSchema), async (req, res, next) => {
  try {
    const { paymentReference, gatewayReference } = req.body;
    const result = await walletService.verifyAndCredit(
      req.user!.id,
      paymentReference,
      gatewayReference
    );

    res.json({
      success: true,
      data: result,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const walletRouter = router;

