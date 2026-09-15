import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { env } from './shared/config/env';
import { authRouter } from './routes/auth.routes';

const _HEALTH_PATH = '/health';
const _AUTH_ROUTER_PATH = '/api/auth';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get(_HEALTH_PATH, (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use(_AUTH_ROUTER_PATH, authRouter);

  return app;
}
