import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodErr = result.error as ZodError;
      const messages = zodErr.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      next(new ValidationError(messages.join('; ')));
    } else {
      req.body = result.data;
      next();
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const zodErr = result.error as ZodError;
      const messages = zodErr.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      next(new ValidationError(messages.join('; ')));
    } else {
      req.query = result.data as Record<string, string>;
      next();
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const zodErr = result.error as ZodError;
      const messages = zodErr.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      next(new ValidationError(messages.join('; ')));
    } else {
      req.params = result.data as Record<string, string>;
      next();
    }
  };
}
