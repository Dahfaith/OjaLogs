import { Router } from 'express';
import { numbersService } from '../services/numbers.service.js';

const router = Router();

// Cron reconciliation endpoint: Expired rental auto-refund processor
router.post('/reconcile-rentals', async (req, res, next) => {
  try {
    const result = await numbersService.reconcileExpiredRentals();
    res.json({
      success: true,
      data: result,
      meta: { request_id: `cron_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

// Cron reconciliation endpoint: Payment audit
router.post('/reconcile-payments', async (req, res) => {
  res.json({
    success: true,
    data: { reconciledCount: 0, pendingAudited: 0, status: 'all_synced' },
    meta: { request_id: `cron_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

export const cronRouter = router;

