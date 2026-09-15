import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { env } from './shared/config/env';
import { auditRouter } from './routes/audit.routes';
import { authRouter } from './routes/auth.routes';
import { marketsRouter } from './routes/markets.routes';
import { thresholdsRouter } from './routes/thresholds.routes';
import { watchlistRouter } from './routes/watchlist.routes';
import { errorHandler } from './shared/middleware/errorHandler';

const _HEALTH_PATH = '/health';
const _AUTH_ROUTER_PATH = '/api/auth';
const _API_ROUTER_PATH = '/api';
const _CACHE_CONTROL_HEADER = 'Cache-Control';
const _NO_STORE_DIRECTIVE = 'no-store';

function disableCaching(_req: Request, res: Response, next: () => void): void {
  res.setHeader(_CACHE_CONTROL_HEADER, _NO_STORE_DIRECTIVE);
  next();
}

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get(_HEALTH_PATH, (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use(_API_ROUTER_PATH, disableCaching);
  app.use(_AUTH_ROUTER_PATH, authRouter);
  app.use(_API_ROUTER_PATH, marketsRouter);
  app.use(_API_ROUTER_PATH, watchlistRouter);
  app.use(_API_ROUTER_PATH, thresholdsRouter);
  app.use(_API_ROUTER_PATH, auditRouter);

  app.use(errorHandler);

  return app;
}
