import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { smmService } from '../services/smm.service.js';
import { validateBody } from '../middleware/validate.js';
import { SMMOrderInputSchema, SMMStandardApiRequestSchema } from '@ojalogs/shared';
import { z } from 'zod';

const router = Router();

// ==========================================
// 1. Ojalogs Standard SMM Protocol Endpoint
// (Reseller API compatible with SMM panels & bots)
// ==========================================
router.all('/api', validateBody(SMMStandardApiRequestSchema), async (req, res, next) => {
  try {
    const payload = req.method === 'GET' ? req.query : req.body;
    // In production, key can be mapped to a specific reseller's account
    const result = await smmService.handleStandardSMMRequest(payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Also accept standard protocol at root POST /api/v1/smm
router.post('/', async (req, res, next) => {
  try {
    if (req.body && req.body.action) {
      const result = await smmService.handleStandardSMMRequest(req.body);
      return res.json(result);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. Public Storefront Service Directory
// ==========================================
router.get('/services', (req, res) => {
  const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
  const services = smmService.getPublicServices(platform);

  res.json({
    success: true,
    data: services,
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

// ==========================================
// 3. Customer Orders (Requires Customer Auth)
// ==========================================
router.post('/orders', authMiddleware, validateBody(SMMOrderInputSchema), async (req, res, next) => {
  try {
    const { serviceId, targetLink, quantity, idempotencyKey } = req.body;
    const order = await smmService.placeOrder(
      req.user!.id,
      req.user!.email,
      serviceId,
      targetLink,
      quantity,
      idempotencyKey
    );

    res.status(201).json({
      success: true,
      data: order,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', authMiddleware, (req, res) => {
  const orders = smmService.getOrders(req.user!.id);
  res.json({
    success: true,
    data: orders,
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.post('/orders/:id/sync', authMiddleware, async (req, res, next) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await smmService.syncOrderStatus(orderId);
    res.json({
      success: true,
      data: order,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const smmRouter = router;
