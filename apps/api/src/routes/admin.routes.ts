import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { catalogService } from '../services/catalog.service.js';
import { serverApiRegistry } from '../adapters/server/server.registry.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('administrator', 'super_administrator'));

router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenueNgn: 8645200.00,
      walletLiabilitiesNgn: 1980400.00,
      totalOrders: 432,
      activeRentals: 28,
      registeredCustomers: 1480,
      systemHealth: 'OPERATIONAL'
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

const EncryptBatchSchema = z.object({
  productId: z.string().min(1),
  rawKeysPayload: z.string().min(1)
});

router.post('/inventory/encrypt-batch', validateBody(EncryptBatchSchema), (req, res, next) => {
  try {
    const { productId, rawKeysPayload } = req.body;
    const result = catalogService.addEncryptedInventory(productId, rawKeysPayload);

    res.status(201).json({
      success: true,
      data: result,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/servers/status', async (req, res, next) => {
  try {
    const health = await serverApiRegistry.getAllHealth();
    res.json({
      success: true,
      data: health,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const adminRouter = router;

