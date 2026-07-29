import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { isDevelopment } from '../config/env.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Resource not found' });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err.message);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack }),
  });
}
