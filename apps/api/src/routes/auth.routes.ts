import type { Role } from '@app/shared';
import { ROLE_PERMISSIONS } from '@app/shared';
import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { auditService } from '../domains/audit/auditService';
import {
  _COOKIE_NAME,
  buildClearCookie,
  buildCookie,
  createSession,
  verifySession,
} from '../domains/auth/session';
import { withAuth } from '../shared/middleware/withAuth';

const _LOGIN_PATH = '/login';
const _LOGOUT_PATH = '/logout';
const _ME_PATH = '/me';
const _BAD_REQUEST_STATUS = 400;
const _UNAUTHORIZED_STATUS = 401;
const _INTERNAL_ERROR_STATUS = 500;

const _ROLE_VALUES = Object.keys(ROLE_PERMISSIONS) as [Role, ...Role[]];

const _loginSchema = z.object({
  role: z.enum(_ROLE_VALUES),
});

export const authRouter = Router();

authRouter.post(_LOGIN_PATH, async (req, res) => {
  let result: Response;

  const parsed = _loginSchema.safeParse(req.body);

  if (!parsed.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_body' });
  } else {
    try {
      const token = await createSession(parsed.data.role);
      const session = await verifySession(token);

      if (session) {
        auditService.record({
          actorSub: session.sub,
          actorRole: session.role,
          action: 'auth.login',
        });
      }

      res.cookie(_COOKIE_NAME, token, buildCookie(token));
      result = res.json({ role: parsed.data.role });
    } catch (error) {
      console.error('Failed to log in:', error);
      result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
    }
  }

  return result;
});

authRouter.post(_LOGOUT_PATH, async (req, res) => {
  const token = req.cookies?.[_COOKIE_NAME];
  const session = typeof token === 'string' ? await verifySession(token) : null;

  if (session) {
    auditService.record({
      actorSub: session.sub,
      actorRole: session.role,
      action: 'auth.logout',
    });
  }

  const result = res.clearCookie(_COOKIE_NAME, buildClearCookie()).json({ ok: true });

  return result;
});

authRouter.get(_ME_PATH, withAuth(), (req, res) => {
  let result: Response;

  if (req.session) {
    result = res.json({ role: req.session.role });
  } else {
    result = res.status(_UNAUTHORIZED_STATUS).json({ error: 'unauthorized' });
  }

  return result;
});
