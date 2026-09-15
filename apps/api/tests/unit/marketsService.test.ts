import type { MarketDTO } from '@app/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { coinGeckoRepository, RateLimitedError } from '../../src/repositories/coinGeckoRepository';
import { marketsService } from '../../src/domains/markets/marketsService';

vi.mock('../../src/repositories/coinGeckoRepository', () => {
  class RateLimitedError extends Error {}

  return {
    coinGeckoRepository: {
      fetchMarkets: vi.fn(),
      fetchMarketChart: vi.fn(),
      fetchSupportedVsCurrencies: vi.fn(),
    },
    RateLimitedError,
  };
});

const mockedFetchMarkets = vi.mocked(coinGeckoRepository.fetchMarkets);

describe('marketsService.getMarkets', () => {
  beforeEach(() => {
    mockedFetchMarkets.mockReset();
  });

  it('fetches from the repository on a cache miss and returns a clean DTO', async () => {
    mockedFetchMarkets.mockResolvedValueOnce([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 65_000,
        price_change_percentage_24h: 1.5,
        total_volume: 111,
        market_cap: 222,
      },
    ]);

    const result = await marketsService.getMarkets({ vsCurrency: 'usd' });

    expect(result.source).toBe('live');
    expect(result.data).toEqual<MarketDTO[]>([
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', price: 65_000, change24h: 1.5, volume24h: 111, marketCap: 222 },
    ]);
    expect(mockedFetchMarkets).toHaveBeenCalledTimes(1);
  });

  it('serves subsequent requests from cache without hitting the repository again', async () => {
    mockedFetchMarkets.mockResolvedValue([
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 3_400,
        price_change_percentage_24h: -0.5,
        total_volume: 10,
        market_cap: 20,
      },
    ]);

    await marketsService.getMarkets({ vsCurrency: 'eur' });
    await marketsService.getMarkets({ vsCurrency: 'eur' });

    expect(mockedFetchMarkets).toHaveBeenCalledTimes(1);
  });

  it('derives the cache key from vsCurrency and sorted ids', async () => {
    mockedFetchMarkets.mockResolvedValue([]);

    await marketsService.getMarkets({ vsCurrency: 'gbp', ids: ['ethereum', 'bitcoin'] });
    await marketsService.getMarkets({ vsCurrency: 'gbp', ids: ['bitcoin', 'ethereum'] });

    expect(mockedFetchMarkets).toHaveBeenCalledTimes(1);
  });

  it('falls back to mock data when the repository throws RateLimitedError', async () => {
    mockedFetchMarkets.mockRejectedValueOnce(new RateLimitedError());

    const result = await marketsService.getMarkets({ vsCurrency: 'jpy' });

    expect(result.source).toBe('mock');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('rethrows non-rate-limit errors instead of falling back to mock data', async () => {
    mockedFetchMarkets.mockRejectedValueOnce(new Error('boom'));

    await expect(marketsService.getMarkets({ vsCurrency: 'aud' })).rejects.toThrow('boom');
  });
});
