import express from 'express';
import http from 'node:http';
import { env } from './config/env.js';
import {
  configureCors,
  configureHelmet,
  configureMorgan,
} from './config/middleware.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.routes.js';
import { initSocketServer } from './sockets/index.js';

const app = express();
const httpServer = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────
app.use(configureHelmet());
app.use(configureCors());
app.use(configureMorgan());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

// ── Routes ───────────────────────────────────────────────────────
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Error handling ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Real-time ────────────────────────────────────────────────────
initSocketServer(httpServer);

// ── Start ────────────────────────────────────────────────────────
httpServer.listen(env.port, () => {
  console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

export { app, httpServer };
