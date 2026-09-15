import type { Permission } from '@app/shared';
import { hasAllPermissions } from '@app/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { _COOKIE_NAME, verifySession } from '../../domains/auth/session';

const _UNAUTHORIZED_STATUS = 401;
const _FORBIDDEN_STATUS = 403;

interface WithAuthOptions {
  requires?: Permission[];
}

export function withAuth(options?: WithAuthOptions): RequestHandler {
  const requires = options?.requires ?? [];

  return async (req: Request, res: Response, next: NextFunction) => {
    let result: Response | void;

    const token = req.cookies?.[_COOKIE_NAME];
    const session = typeof token === 'string' ? await verifySession(token) : null;

    if (session === null) {
      result = res.status(_UNAUTHORIZED_STATUS).json({ error: 'unauthorized' });
    } else if (!hasAllPermissions(session.role, requires)) {
      result = res.status(_FORBIDDEN_STATUS).json({ error: 'forbidden' });
    } else {
      req.session = session;
      next();
      result = undefined;
    }

    return result;
  };
}
