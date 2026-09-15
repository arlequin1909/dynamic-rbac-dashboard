import { z } from 'zod';

const _DEFAULT_PORT = 4000;
const _DEFAULT_COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const _DEFAULT_WEB_ORIGIN = 'http://localhost:5173';
const _DEFAULT_NODE_ENV = 'development';

const _envSchema = z.object({
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),
  COINGECKO_BASE_URL: z.string().url().default(_DEFAULT_COINGECKO_BASE_URL),
  PORT: z.coerce.number().int().positive().default(_DEFAULT_PORT),
  NODE_ENV: z.enum(['development', 'production', 'test']).default(_DEFAULT_NODE_ENV),
  WEB_ORIGIN: z.string().url().default(_DEFAULT_WEB_ORIGIN),
});

export type Env = z.infer<typeof _envSchema>;

function loadEnv(): Env {
  let result: Env;

  try {
    result = _envSchema.parse(process.env);
  } catch (error) {
    console.error('Invalid environment configuration:', error);
    throw error;
  }

  return result;
}

export const env = loadEnv();
