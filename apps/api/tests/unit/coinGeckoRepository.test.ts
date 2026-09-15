import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { coinGeckoRepository } from '../../src/repositories/coinGeckoRepository';
import { RateLimitedError } from '../../src/shared/middleware/errorHandler';

const _BASE_URL = 'https://api.coingecko.com/api/v3';
const _EXPECTED_ATTEMPTS = 4;

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => {
  server.close();
});

describe('coinGeckoRepository', () => {
  it('returns parsed markets on a 200 response', async () => {
    server.use(
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

    const result = await coinGeckoRepository.fetchMarkets({ vsCurrency: 'usd' });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('bitcoin');
  });

  it('returns a parsed chart on a 200 response', async () => {
    server.use(
      http.get(`${_BASE_URL}/coins/bitcoin/market_chart`, () =>
        HttpResponse.json({ prices: [[1000, 65_000]] })
      )
    );

    const result = await coinGeckoRepository.fetchMarketChart({ id: 'bitcoin', days: 1 });

    expect(result.prices).toEqual([[1000, 65_000]]);
  });

  it('returns supported vs currencies on a 200 response', async () => {
    server.use(
      http.get(`${_BASE_URL}/simple/supported_vs_currencies`, () =>
        HttpResponse.json(['usd', 'eur'])
      )
    );

    const result = await coinGeckoRepository.fetchSupportedVsCurrencies();

    expect(result).toEqual(['usd', 'eur']);
  });

  it('retries on 429 and throws RateLimitedError once retries are exhausted', async () => {
    vi.useFakeTimers();

    let callCount = 0;

    server.use(
      http.get(`${_BASE_URL}/coins/markets`, () => {
        callCount += 1;

        return new HttpResponse(null, { status: 429 });
      })
    );

    const promise = coinGeckoRepository.fetchMarkets({ vsCurrency: 'usd' });
    const assertion = expect(promise).rejects.toBeInstanceOf(RateLimitedError);

    await vi.runAllTimersAsync();
    await assertion;

    expect(callCount).toBe(_EXPECTED_ATTEMPTS);
  });

  it('retries on a 5xx response and throws RateLimitedError once retries are exhausted', async () => {
    vi.useFakeTimers();

    let callCount = 0;

    server.use(
      http.get(`${_BASE_URL}/coins/markets`, () => {
        callCount += 1;

        return new HttpResponse(null, { status: 503 });
      })
    );

    const promise = coinGeckoRepository.fetchMarkets({ vsCurrency: 'usd' });
    const assertion = expect(promise).rejects.toBeInstanceOf(RateLimitedError);

    await vi.runAllTimersAsync();
    await assertion;

    expect(callCount).toBe(_EXPECTED_ATTEMPTS);
  });

  it('aborts a hanging request via the timeout and eventually throws RateLimitedError', async () => {
    vi.useFakeTimers();

    server.use(http.get(`${_BASE_URL}/coins/markets`, () => new Promise(() => {})));

    const promise = coinGeckoRepository.fetchMarkets({ vsCurrency: 'usd' });
    const assertion = expect(promise).rejects.toBeInstanceOf(RateLimitedError);

    await vi.runAllTimersAsync();
    await assertion;
  });
});
