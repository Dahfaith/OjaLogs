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
    // Never throttle admin console routes or administrative requests
    const path = req.originalUrl || req.path || '';
    const adminHeader = ((req.headers['x-admin-email'] || req.headers['x-user-email']) as string || '').toLowerCase().trim();
    const isKnownAdmin = adminHeader === 'visioreach@gmail.com' || adminHeader === 'ojalogs@gmail.com';
    const isAdminRoute = path.includes('/admin') || (req.baseUrl && req.baseUrl.includes('/admin'));

    if (isAdminRoute || isKnownAdmin) {
      return next();
    }

    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim() || '127.0.0.1';
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
export const generalLimiter = createRateLimiter({ name: 'api', maxRequests: 300, windowMs: 60 * 1000 });
export const authLimiter = createRateLimiter({ name: 'auth', maxRequests: 60, windowMs: 60 * 1000 });
export const moneyLimiter = createRateLimiter({ name: 'finance', maxRequests: 60, windowMs: 60 * 1000 });
export const numberRequestLimiter = createRateLimiter({ name: 'numbers', maxRequests: 60, windowMs: 60 * 1000 });
