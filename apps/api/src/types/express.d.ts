import type { Session } from '@app/shared';

declare global {
  namespace Express {
    interface Request {
      session?: Session;
    }
  }
}

export {};
