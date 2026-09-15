import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('audit routes', () => {
  it('rejects GET /api/audit for a trader', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'trader' });
    const response = await agent.get('/api/audit');

    expect(response.status).toBe(403);
  });

  it('lets an admin list audit entries after a login and a threshold change', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'admin' });
    await agent.put('/api/thresholds').send({ volatilityAlertPct: 9 });

    const response = await agent.get('/api/audit');

    expect(response.status).toBe(200);

    const actions = response.body.data.map((entry: { action: string }) => entry.action);

    expect(actions).toContain('auth.login');
    expect(actions).toContain('thresholds.update');
  });

  it('filters audit entries by action', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'admin' });
    await agent.post('/api/watchlist').send({ id: 'bitcoin' });

    const response = await agent.get('/api/audit?action=watchlist.add');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    for (const entry of response.body.data) {
      expect(entry.action).toBe('watchlist.add');
    }
  });
});
