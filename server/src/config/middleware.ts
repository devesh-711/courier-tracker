import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './env.js';

export function configureHelmet() {
  return helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    originAgentCluster: false,
    frameguard: { action: 'deny' },
    hsts: isProduction,
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'no-referrer' },
  });
}

export function configureCors() {
  return cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  });
}

export function configureMorgan() {
  return morgan(isProduction ? 'combined' : 'dev');
}
