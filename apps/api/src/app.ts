import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';

const _DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
const _HEALTH_PATH = '/health';

export function createApp(): Express {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? _DEFAULT_CORS_ORIGIN;

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get(_HEALTH_PATH, (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return app;
}
