import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { walletRouter } from './wallet.routes.js';
import { catalogRouter } from './catalog.routes.js';
import { orderRouter } from './order.routes.js';
import { numbersRouter } from './numbers.routes.js';
import { adminRouter } from './admin.routes.js';
import { webhookRouter } from './webhook.routes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'Ojalogs Core API',
      version: 'v1.0.0-PRO',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString()
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.use('/auth', authRouter);
router.use('/wallet', walletRouter);
router.use('/catalog', catalogRouter);
router.use('/orders', orderRouter);
router.use('/numbers', numbersRouter);
router.use('/admin', adminRouter);
router.use('/webhooks', webhookRouter);

export const v1Router = router;

