import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { numberRequestLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { numbersService } from '../services/numbers.service.js';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// Get available countries & services
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: {
      countries: numbersService.getCountries(),
      services: numbersService.getServices()
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

// Get user's active & past virtual number sessions
router.get('/', (req, res) => {
  const sessions = numbersService.getUserSessions(req.user!.id);
  res.json({
    success: true,
    data: sessions,
    meta: { count: sessions.length, request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

const RequestNumberSchema = z.object({
  country: z.object({
    code: z.string().min(2),
    name: z.string().min(1),
    dialCode: z.string().min(1),
    flag: z.string().optional().default('🌐'),
    availableNumbers: z.number().optional().default(100)
  }).passthrough(),
  service: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().optional().default('General'),
    icon: z.string().optional().default('MessageSquare'),
    priceNgn: z.number().min(0),
    successRate: z.number().optional().default(98)
  }).passthrough(),
  rentalType: z.enum(['one_time_sms', 'long_term_rental']).default('one_time_sms'),
  idempotencyKey: z.string().min(1)
});

router.post('/request', numberRequestLimiter, idempotencyMiddleware, validateBody(RequestNumberSchema), async (req, res, next) => {
  try {
    const { country, service, rentalType, idempotencyKey } = req.body;
    const session = await numbersService.requestNumber(
      req.user!.id,
      country,
      service,
      rentalType,
      idempotencyKey
    );

    res.status(201).json({
      success: true,
      data: session,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:sessionId/cancel', async (req, res, next) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const result = await numbersService.cancelAndRefund(req.user!.id, sessionId);

    res.json({
      success: true,
      data: result,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

const InboundSmsSchema = z.object({
  sender: z.string().min(1),
  code: z.string().min(1),
  fullText: z.string().min(1)
});

router.post('/:sessionId/sms', validateBody(InboundSmsSchema), (req, res, next) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const { sender, code, fullText } = req.body;
    const msg = numbersService.receiveIncomingSms(sessionId, sender, code, fullText);

    res.status(201).json({
      success: true,
      data: msg,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

const SimulateSmsSchema = z.object({
  sender: z.string().optional(),
  code: z.string().optional()
});

router.post('/:sessionId/simulate-sms', validateBody(SimulateSmsSchema), (req, res, next) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const { sender, code } = req.body;
    const msg = numbersService.simulateIncomingSms(sessionId, sender, code);

    res.status(201).json({
      success: true,
      data: msg,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

const RenewSchema = z.object({
  idempotencyKey: z.string().optional()
});

router.post('/:sessionId/renew', validateBody(RenewSchema), async (req, res, next) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const session = await numbersService.renewRental(req.user!.id, sessionId, req.body.idempotencyKey);

    res.json({
      success: true,
      data: session,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const numbersRouter = router;
