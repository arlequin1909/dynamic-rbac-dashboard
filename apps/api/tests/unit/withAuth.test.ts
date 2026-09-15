import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createSession } from '../../src/domains/auth/session';
import { withAuth } from '../../src/shared/middleware/withAuth';

function createMockRes(): Response {
  const res: Partial<Response> = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);

  return res as Response;
}

function createMockReq(cookieValue?: string): Request {
  const cookies = cookieValue ? { session: cookieValue } : {};

  return { cookies } as unknown as Request;
}

describe('withAuth', () => {
  it('returns 401 when there is no session cookie', async () => {
    const middleware = withAuth();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the session cookie is invalid', async () => {
    const middleware = withAuth();
    const req = createMockReq('not-a-real-token');
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the role lacks the required permissions', async () => {
    const token = await createSession('viewer');
    const middleware = withAuth({ requires: ['audit:read'] });
    const req = createMockReq(token);
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when the role has the required permissions', async () => {
    const token = await createSession('admin');
    const middleware = withAuth({ requires: ['audit:read'] });
    const req = createMockReq(token);
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.session?.role).toBe('admin');
  });
});
