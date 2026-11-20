import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { numberRequestLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { numbersService } from '../services/numbers.service.js';
import { z } from 'zod';

const router = Router();

// Public Catalog Endpoint: Get available countries & services (accessible before auth)
router.get('/options', async (req, res) => {
  const services = await numbersService.refreshServices();
  res.json({
    success: true,
    data: {
      countries: numbersService.getCountries(),
      services
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

// Single Source of Truth: Authoritative Quote Endpoint (publicly verifiable)
const QuoteSchema = z.object({
  serviceId: z.string().min(1),
  countryCode: z.string().optional().default('US'),
  rentalType: z.enum(['one_time_sms', 'long_term_rental']).optional().default('one_time_sms')
});

router.post('/quote', validateBody(QuoteSchema), (req, res, next) => {
  try {
    const { serviceId, countryCode, rentalType } = req.body;
    const quote = numbersService.calculateAuthoritativePrice(serviceId, countryCode, rentalType);
    res.json({
      success: true,
      data: {
        serviceId: quote.service.id,
        serviceName: quote.service.name,
        countryCode: quote.country.code,
        countryName: quote.country.name,
        rentalType,
        unitPriceNgn: quote.unitPriceNgn,
        totalPriceNgn: quote.totalPriceNgn,
        currency: quote.currency
      },
      meta: { request_id: `quote_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/quote', (req, res, next) => {
  try {
    const serviceId = String(req.query.serviceId || req.query.service || '');
    const countryCode = String(req.query.countryCode || req.query.country || 'US');
    const rentalType = req.query.rentalType === 'long_term_rental' ? 'long_term_rental' : 'one_time_sms';
    if (!serviceId) {
      return res.status(400).json({ success: false, error: 'serviceId is required' });
    }
    const quote = numbersService.calculateAuthoritativePrice(serviceId, countryCode, rentalType);
    res.json({
      success: true,
      data: {
        serviceId: quote.service.id,
        serviceName: quote.service.name,
        countryCode: quote.country.code,
        countryName: quote.country.name,
        rentalType,
        unitPriceNgn: quote.unitPriceNgn,
        totalPriceNgn: quote.totalPriceNgn,
        currency: quote.currency
      },
      meta: { request_id: `quote_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

// All routes below require customer authentication
router.use(authMiddleware);

// Get user's active & past virtual number sessions with upstream synchronization
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const initialSessions = numbersService.getUserSessions(userId);

    // Actively synchronize any active sessions with upstream TextPlug
    const activeSessions = initialSessions.filter(s => s.status === 'active');
    if (activeSessions.length > 0) {
      await Promise.allSettled(activeSessions.map(s => numbersService.checkIncomingSms(userId, s.id)));
    }

    const sessions = numbersService.getUserSessions(userId);
    res.json({
      success: true,
      data: sessions,
      meta: { count: sessions.length, request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
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
  idempotencyKey: z.string().min(1),
  expectedPrice: z.number().optional()
});

router.post('/request', numberRequestLimiter, idempotencyMiddleware, validateBody(RequestNumberSchema), async (req, res, next) => {
  try {
    const { country, service, rentalType, idempotencyKey, expectedPrice } = req.body;
    const session = await numbersService.requestNumber(
      req.user!.id,
      country,
      service,
      rentalType,
      idempotencyKey,
      expectedPrice
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

// Explicit "Get SMS" polling endpoint - queries upstream provider (TextPlug) directly
router.post('/:sessionId/check-sms', async (req, res, next) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const session = await numbersService.checkIncomingSms(req.user!.id, sessionId);

    res.json({
      success: true,
      data: session,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

// Resend SMS request to upstream provider
router.post('/:sessionId/resend', async (req, res, next) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const result = await numbersService.resendSms(req.user!.id, sessionId);

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
