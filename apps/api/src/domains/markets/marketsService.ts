import type { ChartPoint, MarketDTO } from '@app/shared';
import { coinGeckoRepository } from '../../repositories/coinGeckoRepository';
import type { RawMarket } from '../../repositories/coinGeckoRepository';
import { MemoryCache } from '../../shared/cache/memoryCache';
import { AppError, RateLimitedError } from '../../shared/middleware/errorHandler';

const _MARKETS_TTL_MS = 30_000;
const _CHART_TTL_MS = 5 * 60_000;
const _CURRENCIES_TTL_MS = 60 * 60_000;

const _MOCK_MARKETS: MarketDTO[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    price: 65_000,
    change24h: 1.2,
    volume24h: 25_000_000_000,
    marketCap: 1_280_000_000_000,
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    price: 3_400,
    change24h: -0.8,
    volume24h: 12_000_000_000,
    marketCap: 410_000_000_000,
  },
  {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether',
    price: 1,
    change24h: 0.01,
    volume24h: 40_000_000_000,
    marketCap: 110_000_000_000,
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    price: 580,
    change24h: 2.1,
    volume24h: 1_800_000_000,
    marketCap: 85_000_000_000,
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    price: 145,
    change24h: 3.4,
    volume24h: 2_500_000_000,
    marketCap: 68_000_000_000,
  },
];

const _cache = new MemoryCache();

export interface GetMarketsOptions {
  vsCurrency: string;
  ids?: string[];
}

export interface MarketsResult {
  data: MarketDTO[];
  source: 'live' | 'mock';
}

export interface GetMarketChartOptions {
  id: string;
  days: number;
}

export interface ChartResult {
  data: ChartPoint[];
}

export interface CurrenciesResult {
  data: string[];
}

function log(event: string, details: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...details }));
}

function buildMarketsCacheKey(vsCurrency: string, ids?: string[]): string {
  const sortedIds = ids ? [...ids].sort().join(',') : '';
  const result = `markets:${vsCurrency}:${sortedIds}`;

  return result;
}

function toMarketDTO(raw: RawMarket): MarketDTO {
  const result: MarketDTO = {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    price: raw.current_price,
    change24h: raw.price_change_percentage_24h ?? 0,
    volume24h: raw.total_volume,
    marketCap: raw.market_cap,
  };

  return result;
}

export const marketsService = {
  async getMarkets(options: GetMarketsOptions): Promise<MarketsResult> {
    let result: MarketsResult;

    try {
      const cacheKey = buildMarketsCacheKey(options.vsCurrency, options.ids);
      const cached = _cache.get<MarketDTO[]>(cacheKey);

      if (cached) {
        log('markets_cache_hit', { cacheKey });
        result = { data: cached, source: 'live' };
      } else {
        log('markets_cache_miss', { cacheKey });

        try {
          const raw = await coinGeckoRepository.fetchMarkets(options);
          const data = raw.map(toMarketDTO);

          _cache.set(cacheKey, data, _MARKETS_TTL_MS);
          result = { data, source: 'live' };
        } catch (error) {
          if (error instanceof RateLimitedError) {
            log('markets_mock_fallback', { cacheKey });
            result = { data: _MOCK_MARKETS, source: 'mock' };
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error('Failed to get markets:', error);
      }

      throw error;
    }

    return result;
  },

  async getMarketChart(options: GetMarketChartOptions): Promise<ChartResult> {
    let result: ChartResult;

    try {
      const cacheKey = `chart:${options.id}:${options.days}`;
      const cached = _cache.get<ChartPoint[]>(cacheKey);

      if (cached) {
        log('chart_cache_hit', { cacheKey });
        result = { data: cached };
      } else {
        log('chart_cache_miss', { cacheKey });

        const raw = await coinGeckoRepository.fetchMarketChart(options);
        const data: ChartPoint[] = raw.prices.map(([t, price]) => ({ t, price }));

        _cache.set(cacheKey, data, _CHART_TTL_MS);
        result = { data };
      }
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error('Failed to get market chart:', error);
      }

      throw error;
    }

    return result;
  },

  async getSupportedVsCurrencies(): Promise<CurrenciesResult> {
    let result: CurrenciesResult;

    try {
      const cacheKey = 'currencies';
      const cached = _cache.get<string[]>(cacheKey);

      if (cached) {
        log('currencies_cache_hit', {});
        result = { data: cached };
      } else {
        log('currencies_cache_miss', {});

        const data = await coinGeckoRepository.fetchSupportedVsCurrencies();

        _cache.set(cacheKey, data, _CURRENCIES_TTL_MS);
        result = { data };
      }
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error('Failed to get supported vs currencies:', error);
      }

      throw error;
    }

    return result;
  },
};
