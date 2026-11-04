import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { orderService } from '../services/order.service.js';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  serverCluster: z.enum(['Server 1', 'Server 2', 'Server 3', 'Server 4']),
  title: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPriceNgn: z.number().min(0)
});

const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  paymentMethod: z.enum(['wallet', 'bach_direct']),
  idempotencyKey: z.string().min(1)
});

router.post('/checkout', idempotencyMiddleware, validateBody(CheckoutSchema), async (req, res, next) => {
  try {
    const { items, paymentMethod, idempotencyKey } = req.body;
    const order = await orderService.checkout(
      req.user!.id,
      req.user!.email,
      items,
      paymentMethod,
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

router.get('/', (req, res) => {
  const orders = orderService.getOrders(req.user!.id);
  res.json({
    success: true,
    data: orders,
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

const RevealSchema = z.object({
  orderItemId: z.string().min(1)
});

router.post('/:orderId/reveal', validateBody(RevealSchema), (req, res, next) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const { orderItemId } = req.body;
    const secret = orderService.revealSecret(req.user!.id, orderId, orderItemId);

    res.json({
      success: true,
      data: secret,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const orderRouter = router;
