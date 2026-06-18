import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/enums.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Guards a route so only the listed roles may access it.
 * Must run after `requireAuth`, which populates `req.user`.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required.'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'You do not have permission to perform this action.'));
      return;
    }

    next();
  };
}
