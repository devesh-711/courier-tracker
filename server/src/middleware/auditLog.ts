import type { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import type { AuthRequest } from '../types/express.js';

export async function auditLog(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const originalSend = _res.json.bind(_res) as (body: unknown) => Response;

  _res.json = (body: unknown): Response => {
    const statusCode = _res.statusCode;
    if (statusCode < 400 && req.user && req.method !== 'GET') {
      const entityType = req.baseUrl.split('/').pop() ?? 'unknown';
      const insertPromise = supabase.from('audit_logs').insert({
        user_id: req.user.id,
        action: req.method,
        entity_type: entityType,
        entity_id: typeof req.params.id === 'string' ? req.params.id : null,
        new_values: Object.keys(req.body).length > 0 ? req.body : null,
        ip_address: typeof req.ip === 'string' ? req.ip : null,
        user_agent: req.headers['user-agent'] ?? null,
      });
      Promise.resolve(insertPromise).then((res) => {
        if (res.error) console.error('[audit-log] failed:', res.error.message);
      });
    }
    return originalSend(body);
  };

  next();
}
