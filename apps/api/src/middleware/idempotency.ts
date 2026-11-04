import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: number;
}

const idempotencyCache = new Map<string, CachedResponse>();
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.body && req.body.idempotencyKey);

  if (!idempotencyKey) {
    return next(new AppError('Missing required Idempotency-Key header for financial transaction.', 400, 'IDEMPOTENCY_KEY_REQUIRED'));
  }

  const cached = idempotencyCache.get(idempotencyKey);
  if (cached) {
    if (Date.now() - cached.timestamp < EXPIRATION_MS) {
      return res.status(cached.statusCode).json(cached.body);
    }
    idempotencyCache.delete(idempotencyKey);
  }

  // Intercept response to store in cache
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(idempotencyKey, {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now()
      });
    }
    return originalJson(body);
  };

  next();
}

