import type { MarketDTO } from '@app/shared';
import type { ReactNode } from 'react';
import useSWR from 'swr';
import { useThresholds } from '../../hooks/useThresholds';
import { apiClient } from '../../lib/apiClient';
import type { MetricKey } from './MetricSelector';

const _MARKETS_REFRESH_MS = 30_000;
const _TOP_N = 10;
const _MOCK_HEADER_NAME = 'x-data-source';
const _MOCK_HEADER_VALUE = 'mock';
const _SKELETON_ROWS = 10;

const _COLUMN_LABELS: Record<MetricKey, string> = {
  price: 'Price',
  change24h: '24h Change',
  volume24h: '24h Volume',
  marketCap: 'Market Cap',
};

interface MarketsFetchResult {
  markets: MarketDTO[];
  isMock: boolean;
}

async function fetchMarkets(path: string): Promise<MarketsFetchResult> {
  const response = await apiClient.getWithHeaders<{ data: MarketDTO[] }>(path);
  const result: MarketsFetchResult = {
    markets: response.data.data,
    isMock: response.headers.get(_MOCK_HEADER_NAME) === _MOCK_HEADER_VALUE,
  };

  return result;
}

function formatMetric(key: MetricKey, market: MarketDTO, vsCurrency: string): string {
  let result: string;

  if (key === 'change24h') {
    result = `${market.change24h.toFixed(2)}%`;
  } else {
    const value = key === 'price' ? market.price : key === 'volume24h' ? market.volume24h : market.marketCap;
    result = `${value.toLocaleString()} ${vsCurrency.toUpperCase()}`;
  }

  return result;
}

function MetricsGridSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: _SKELETON_ROWS }).map((_, index) => (
        <div key={index} className="h-8 rounded bg-slate-900" />
      ))}
    </div>
  );
}

interface MetricsGridProps {
  vsCurrency: string;
  visibleMetrics: MetricKey[];
  onSelectAsset: (id: string) => void;
}

export function MetricsGrid({ vsCurrency, visibleMetrics, onSelectAsset }: MetricsGridProps) {
  const { data, isLoading } = useSWR(`/api/markets?vs=${vsCurrency}`, fetchMarkets, {
    refreshInterval: _MARKETS_REFRESH_MS,
  });
  const { data: thresholds } = useThresholds();
  const volatilityAlertPct = thresholds?.volatilityAlertPct;

  let result: ReactNode;

  if (isLoading || !data) {
    result = <MetricsGridSkeleton />;
  } else {
    const rows = data.markets.slice(0, _TOP_N);

    result = (
      <div>
        {data.isMock && (
          <p className="mb-2 rounded border border-yellow-700 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
            Showing simulated data — live market data is temporarily unavailable.
          </p>
        )}
        <table className="w-full text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 pr-4 font-medium">Asset</th>
              {visibleMetrics.map((key) => (
                <th key={key} className="py-2 pr-4 font-medium">
                  {_COLUMN_LABELS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((market) => {
              const isVolatile =
                volatilityAlertPct !== undefined && Math.abs(market.change24h) >= volatilityAlertPct;
              const rowClassName = isVolatile
                ? 'cursor-pointer border-b border-slate-900 bg-orange-500/10 hover:bg-orange-500/20'
                : 'cursor-pointer border-b border-slate-900 hover:bg-slate-900';

              return (
                <tr key={market.id} onClick={() => onSelectAsset(market.id)} className={rowClassName}>
                  <td className="py-2 pr-4">
                    {market.name} <span className="text-slate-500">{market.symbol.toUpperCase()}</span>
                    {isVolatile && (
                      <span className="ml-2 rounded bg-orange-500/20 px-1.5 py-0.5 text-xs font-medium text-orange-300">
                        Volatile
                      </span>
                    )}
                  </td>
                  {visibleMetrics.map((key) => (
                    <td key={key} className="py-2 pr-4">
                      {formatMetric(key, market, vsCurrency)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return result;
}
