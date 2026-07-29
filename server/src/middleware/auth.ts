import jwt from 'jsonwebtoken';
import type { NextFunction } from 'express';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import type { AuthRequest } from '../types/express.js';

export async function authenticate(req: AuthRequest, _res: unknown, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret) as { id: string; email: string; role: string };

    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, name, is_active')
      .eq('id', payload.id)
      .maybeSingle();

    if (!user || !(user as { is_active: boolean }).is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const userRow = user as { id: string; email: string; role: string; name: string };
    req.user = { id: userRow.id, email: userRow.email, role: userRow.role, name: userRow.name };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(err);
    }
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: unknown, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}
