import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

const _BASE_URL = 'https://api.coingecko.com/api/v3';

const server = setupServer(
  http.get(`${_BASE_URL}/coins/markets`, () =>
    HttpResponse.json([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 65_000,
        price_change_percentage_24h: 1.2,
        total_volume: 1,
        market_cap: 2,
      },
    ])
  )
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('markets routes', () => {
  it('rejects GET /api/markets without a cookie', async () => {
    const app = createApp();

    const response = await request(app).get('/api/markets?vs=usd');

    expect(response.status).toBe(401);
  });

  it('returns markets for an authenticated viewer', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ role: 'viewer' });
    const response = await agent.get('/api/markets?vs=usd');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).toMatchObject({ id: 'bitcoin' });
  });
});
