import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('auth routes', () => {
  it('rejects login with an invalid body', async () => {
    const app = createApp();

    const response = await request(app).post('/api/auth/login').send({ role: 'superadmin' });

    expect(response.status).toBe(400);
  });

  it('logs in as viewer and sets a session cookie', async () => {
    const app = createApp();

    const response = await request(app).post('/api/auth/login').send({ role: 'viewer' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ role: 'viewer' });
    expect(response.headers['set-cookie']?.[0]).toContain('session=');
  });

  it('rejects /me without a cookie', async () => {
    const app = createApp();

    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('returns the role for /me with a valid cookie', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'trader' });
    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ role: 'trader' });
  });

  it('clears the session cookie on logout', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'admin' });
    const response = await agent.post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });

    const setCookie = response.headers['set-cookie']?.[0] ?? '';

    expect(setCookie).toContain('session=;');
  });
});
