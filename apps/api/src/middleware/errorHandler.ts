import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    request_id: string;
    timestamp: string;
  };
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input parameters',
        details: err.flatten().fieldErrors
      },
      meta: { request_id: requestId, timestamp }
    });
  }

  // Known Application Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      meta: { request_id: requestId, timestamp }
    });
  }

  // Unhandled Internal Errors
  console.error('[UNHANDLED_ERROR]', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact support.'
    },
    meta: { request_id: requestId, timestamp }
  });
}

