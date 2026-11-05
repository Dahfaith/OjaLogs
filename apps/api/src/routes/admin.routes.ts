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

// Upstream Server API Configuration Management
router.get('/servers/configs', (req, res) => {
  const configs = serverApiRegistry.getAllConfigs();
  res.json({
    success: true,
    data: configs,
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

const UpdateServerConfigSchema = z.object({
  apiUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  fulfillmentMode: z.enum(['automated_api', 'vault_inventory', 'hybrid']).optional(),
  webhookSecret: z.string().optional()
});

router.patch('/servers/:clusterName', validateBody(UpdateServerConfigSchema), (req, res, next) => {
  try {
    const rawCluster = Array.isArray(req.params.clusterName) ? req.params.clusterName[0] : req.params.clusterName;
    const clusterName = decodeURIComponent(rawCluster);
    const updated = serverApiRegistry.updateConfig(clusterName, req.body);
    res.json({
      success: true,
      data: updated,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/servers/:clusterName/test', async (req, res, next) => {
  try {
    const rawCluster = Array.isArray(req.params.clusterName) ? req.params.clusterName[0] : req.params.clusterName;
    const clusterName = decodeURIComponent(rawCluster);
    const result = await serverApiRegistry.testConnection(clusterName);
    res.json({
      success: true,
      data: result,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const adminRouter = router;

