import type { ChartPoint } from '@app/shared';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useSWR from 'swr';
import { UnauthorizedNotice } from '../auth/UnauthorizedNotice';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { ApiError, apiClient } from '../../lib/apiClient';

export type Timeframe = '1' | '7' | '30';

interface TimeframeOption {
  value: Timeframe;
  label: string;
}

const _TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: '1', label: '1D' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
];
const _CHART_HEIGHT = 300;
const _GRID_COLOR = '#1e293b';
const _AXIS_COLOR = '#64748b';
const _LINE_COLOR = '#38bdf8';
const _FORBIDDEN_STATUS = 403;
const _EMPTY_MESSAGE = 'No price history available for this asset yet.';
const _ERROR_MESSAGE = 'Could not load the price chart.';

async function fetchChart(path: string): Promise<ChartPoint[]> {
  const response = await apiClient.get<{ data: ChartPoint[] }>(path);
  const result = response.data;

  return result;
}

interface ChartRow {
  time: string;
  price: number;
}

function toChartRows(points: ChartPoint[]): ChartRow[] {
  const result = points.map((point) => ({
    time: new Date(point.t).toLocaleDateString(),
    price: point.price,
  }));

  return result;
}

interface PriceChartProps {
  id: string;
  timeframe: Timeframe;
}

export function PriceChart({ id, timeframe: initialTimeframe }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const { data, error, isLoading, mutate } = useSWR(
    `/api/markets/${id}/chart?days=${timeframe}`,
    fetchChart
  );

  let chart: ReactNode;

  if (error instanceof ApiError && error.status === _FORBIDDEN_STATUS) {
    chart = <UnauthorizedNotice />;
  } else if (error) {
    chart = <ErrorState message={_ERROR_MESSAGE} onRetry={() => mutate()} />;
  } else if (isLoading || !data) {
    chart = <div className="h-[300px] animate-pulse rounded bg-slate-900" />;
  } else if (data.length === 0) {
    chart = <EmptyState message={_EMPTY_MESSAGE} />;
  } else {
    chart = (
      <ResponsiveContainer width="100%" height={_CHART_HEIGHT}>
        <LineChart data={toChartRows(data)}>
          <CartesianGrid strokeDasharray="3 3" stroke={_GRID_COLOR} />
          <XAxis dataKey="time" stroke={_AXIS_COLOR} fontSize={12} />
          <YAxis stroke={_AXIS_COLOR} fontSize={12} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: `1px solid ${_GRID_COLOR}` }}
          />
          <Line type="monotone" dataKey="price" stroke={_LINE_COLOR} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        {_TIMEFRAME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTimeframe(option.value)}
            className={
              option.value === timeframe
                ? 'rounded bg-sky-600 px-2 py-1 text-sm text-white'
                : 'rounded bg-slate-800 px-2 py-1 text-sm text-slate-300 hover:bg-slate-700'
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      {chart}
    </div>
  );
}
