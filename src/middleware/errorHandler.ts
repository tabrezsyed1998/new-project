import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error.' : error.message;

  res.status(statusCode).json({
    message,
    ...(env.nodeEnv !== 'production' && {
      stack: error.stack
    })
  });
}
