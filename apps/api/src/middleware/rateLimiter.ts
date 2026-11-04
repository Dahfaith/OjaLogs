import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface RateLimitStore {
  [ip: string]: { count: number; resetTime: number };
}

const rateLimiters: { [key: string]: RateLimitStore } = {};

export function createRateLimiter(options: {
  name: string;
  maxRequests: number;
  windowMs: number;
}) {
  const store: RateLimitStore = {};
  rateLimiters[options.name] = store;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + options.windowMs
      };
      return next();
    }

    store[ip].count += 1;

    if (store[ip].count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((store[ip].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return next(
        new AppError(
          `Too many requests on ${options.name}. Please retry after ${retryAfterSeconds} seconds.`,
          429,
          'RATE_LIMIT_EXCEEDED',
          { retryAfterSeconds }
        )
      );
    }

    next();
  };
}

// Pre-configured rate limits
export const generalLimiter = createRateLimiter({ name: 'api', maxRequests: 120, windowMs: 60 * 1000 });
export const authLimiter = createRateLimiter({ name: 'auth', maxRequests: 15, windowMs: 60 * 1000 });
export const moneyLimiter = createRateLimiter({ name: 'finance', maxRequests: 20, windowMs: 60 * 1000 });
export const numberRequestLimiter = createRateLimiter({ name: 'numbers', maxRequests: 30, windowMs: 60 * 1000 });

