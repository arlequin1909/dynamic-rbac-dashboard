import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('thresholds routes', () => {
  it('lets a viewer read the current threshold', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'viewer' });
    const response = await agent.get('/api/thresholds');

    expect(response.status).toBe(200);
    expect(typeof response.body.data.volatilityAlertPct).toBe('number');
  });

  it('rejects PUT /api/thresholds for a trader', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'trader' });
    const response = await agent.put('/api/thresholds').send({ volatilityAlertPct: 10 });

    expect(response.status).toBe(403);
  });

  it('lets an admin update the threshold and reflects it on GET', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'admin' });

    const putResponse = await agent.put('/api/thresholds').send({ volatilityAlertPct: 12.5 });

    expect(putResponse.status).toBe(200);
    expect(putResponse.body.data).toEqual({ volatilityAlertPct: 12.5 });

    const getResponse = await agent.get('/api/thresholds');

    expect(getResponse.body.data).toEqual({ volatilityAlertPct: 12.5 });
  });

  it('rejects an out-of-range threshold with 400', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'admin' });
    const response = await agent.put('/api/thresholds').send({ volatilityAlertPct: 200 });

    expect(response.status).toBe(400);
  });
});
