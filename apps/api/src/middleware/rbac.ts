import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { UserRole } from '@ojalogs/shared';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Role '${req.user.role}' lacks permissions for this endpoint.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

export function requireVerifiedCustomer(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  if (!req.user.isVerified) {
    return next(new AppError('Email verification required before purchasing.', 403, 'EMAIL_NOT_VERIFIED'));
  }
  next();
}

