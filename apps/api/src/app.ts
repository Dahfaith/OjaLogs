import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v1Router } from './routes/index.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export const app = express();

// Security Headers & CORS
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Idempotency-Key',
    'x-request-id',
    'x-admin-email',
    'x-user-email',
    'x-user-id',
    'Accept',
    'Origin',
    'X-Requested-With'
  ]
}));
app.options('*', cors());

// Request ID injector
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// JSON Body Parser with rawBody preservation for HMAC signature verification
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(generalLimiter);

// Mount API v1 Routes
app.use('/api/v1', v1Router);

// 404 Route Catch-all
app.use('*', (req, res, next) => {
  next(new AppError(`Route '${req.originalUrl}' not found on this server.`, 404, 'ROUTE_NOT_FOUND'));
});

// Centralized Error Handler
app.use(errorHandler);

