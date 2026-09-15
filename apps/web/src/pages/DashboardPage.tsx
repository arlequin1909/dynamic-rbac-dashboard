import type { Permission } from '@app/shared';
import { useState } from 'react';
import { RoleGate } from '../components/auth/RoleGate';
import { UnauthorizedNotice } from '../components/auth/UnauthorizedNotice';
import { CurrencySelector } from '../components/markets/CurrencySelector';
import { MetricsGrid } from '../components/markets/MetricsGrid';
import { DEFAULT_METRIC_KEYS, MetricSelector } from '../components/markets/MetricSelector';
import type { MetricKey } from '../components/markets/MetricSelector';
import { PriceChart } from '../components/markets/PriceChart';
import { ThresholdsForm } from '../components/thresholds/ThresholdsForm';
import { Watchlist } from '../components/watchlist/Watchlist';

const _METRICS_PERMISSIONS: Permission[] = ['metrics:read'];
const _WATCHLIST_READ_PERMISSIONS: Permission[] = ['watchlist:read'];
const _THRESHOLDS_WRITE_PERMISSIONS: Permission[] = ['thresholds:write'];
const _DEFAULT_VS_CURRENCY = 'usd';
const _DEFAULT_TIMEFRAME = '1';

export function DashboardPage() {
  const [vsCurrency, setVsCurrency] = useState(_DEFAULT_VS_CURRENCY);
  const [visibleMetrics, setVisibleMetrics] = useState<MetricKey[]>(DEFAULT_METRIC_KEYS);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  return (
    <RoleGate requires={_METRICS_PERMISSIONS} fallback={<UnauthorizedNotice />}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <MetricSelector onChange={setVisibleMetrics} />
          <CurrencySelector value={vsCurrency} onChange={setVsCurrency} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <MetricsGrid
            vsCurrency={vsCurrency}
            visibleMetrics={visibleMetrics}
            onSelectAsset={setSelectedAsset}
          />
          <div className="space-y-4">
            {selectedAsset ? (
              <PriceChart id={selectedAsset} timeframe={_DEFAULT_TIMEFRAME} />
            ) : (
              <p className="text-sm text-slate-500">Select an asset to see its chart.</p>
            )}
            <RoleGate requires={_WATCHLIST_READ_PERMISSIONS}>
              <Watchlist assetToAdd={selectedAsset} />
            </RoleGate>
            <RoleGate requires={_THRESHOLDS_WRITE_PERMISSIONS}>
              <ThresholdsForm />
            </RoleGate>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
