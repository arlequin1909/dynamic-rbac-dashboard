import { env } from '../shared/config/env';
import { RateLimitedError } from '../shared/middleware/errorHandler';

const _MAX_RETRIES = 3;
const _BACKOFF_BASE_MS = 300;
const _TIMEOUT_MS = 5000;
const _RATE_LIMITED_STATUS = 429;
const _SERVER_ERROR_MIN_STATUS = 500;
const _DEFAULT_CHART_VS_CURRENCY = 'usd';

export interface RawMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  total_volume: number;
  market_cap: number;
}

export interface RawChart {
  prices: [number, number][];
}

export interface FetchMarketsOptions {
  vsCurrency: string;
  ids?: string[];
}

export interface FetchChartOptions {
  id: string;
  days: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status: number): boolean {
  return status === _RATE_LIMITED_STATUS || status >= _SERVER_ERROR_MIN_STATUS;
}

function buildUrl(path: string, params: Record<string, string | undefined>): string {
  const url = new URL(`${env.COINGECKO_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function requestOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), _TIMEOUT_MS);
  let result: Response;

  try {
    result = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  return result;
}

async function fetchWithRetry(url: string): Promise<Response> {
  let result: Response | null = null;

  for (let attempt = 0; attempt <= _MAX_RETRIES && result === null; attempt += 1) {
    const isLastAttempt = attempt === _MAX_RETRIES;

    try {
      const response = await requestOnce(url);

      if (!isRetryableStatus(response.status)) {
        result = response;
      } else if (isLastAttempt) {
        throw new RateLimitedError();
      } else {
        await sleep(_BACKOFF_BASE_MS * 2 ** attempt);
      }
    } catch (error) {
      if (error instanceof RateLimitedError) {
        throw error;
      }

      if (isLastAttempt) {
        throw new RateLimitedError('CoinGecko request failed after retries');
      }

      await sleep(_BACKOFF_BASE_MS * 2 ** attempt);
    }
  }

  if (result === null) {
    throw new RateLimitedError();
  }

  return result;
}

export const coinGeckoRepository = {
  async fetchMarkets({ vsCurrency, ids }: FetchMarketsOptions): Promise<RawMarket[]> {
    const url = buildUrl('/coins/markets', {
      vs_currency: vsCurrency,
      ids: ids?.join(','),
    });

    const response = await fetchWithRetry(url);
    const result = (await response.json()) as RawMarket[];

    return result;
  },

  async fetchMarketChart({ id, days }: FetchChartOptions): Promise<RawChart> {
    const url = buildUrl(`/coins/${id}/market_chart`, {
      vs_currency: _DEFAULT_CHART_VS_CURRENCY,
      days: String(days),
    });

    const response = await fetchWithRetry(url);
    const result = (await response.json()) as RawChart;

    return result;
  },

  async fetchSupportedVsCurrencies(): Promise<string[]> {
    const url = buildUrl('/simple/supported_vs_currencies', {});
    const response = await fetchWithRetry(url);
    const result = (await response.json()) as string[];

    return result;
  },
};
