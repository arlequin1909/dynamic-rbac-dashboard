import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('watchlist routes', () => {
  it('rejects GET /api/watchlist without a cookie', async () => {
    const app = createApp();

    const response = await request(app).get('/api/watchlist');

    expect(response.status).toBe(401);
  });

  it('rejects POST /api/watchlist for a viewer', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'viewer' });
    const response = await agent.post('/api/watchlist').send({ id: 'bitcoin' });

    expect(response.status).toBe(403);
  });

  it('lets a trader add an item and reflects it on GET', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'trader' });

    const postResponse = await agent.post('/api/watchlist').send({ id: 'bitcoin' });

    expect(postResponse.status).toBe(200);
    expect(postResponse.body.data).toContain('bitcoin');

    const getResponse = await agent.get('/api/watchlist');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toContain('bitcoin');
  });

  it('rejects a duplicate add with 409', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'trader' });
    await agent.post('/api/watchlist').send({ id: 'ethereum' });
    const response = await agent.post('/api/watchlist').send({ id: 'ethereum' });

    expect(response.status).toBe(409);
  });

  it('lets a trader remove an item and reflects it on GET', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'trader' });
    await agent.post('/api/watchlist').send({ id: 'solana' });

    const deleteResponse = await agent.delete('/api/watchlist/solana');

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data).not.toContain('solana');

    const getResponse = await agent.get('/api/watchlist');

    expect(getResponse.body.data).not.toContain('solana');
  });

  it('rejects DELETE /api/watchlist/:id for a viewer', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'viewer' });
    const response = await agent.delete('/api/watchlist/bitcoin');

    expect(response.status).toBe(403);
  });
});
