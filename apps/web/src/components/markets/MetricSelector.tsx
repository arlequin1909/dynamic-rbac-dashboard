import { useState } from 'react';

export type MetricKey = 'price' | 'change24h' | 'volume24h' | 'marketCap';

interface MetricOption {
  key: MetricKey;
  label: string;
}

const _METRIC_OPTIONS: MetricOption[] = [
  { key: 'price', label: 'Price' },
  { key: 'change24h', label: '24h Change' },
  { key: 'volume24h', label: '24h Volume' },
  { key: 'marketCap', label: 'Market Cap' },
];

export const DEFAULT_METRIC_KEYS: MetricKey[] = _METRIC_OPTIONS.map((option) => option.key);

interface MetricSelectorProps {
  onChange: (selected: MetricKey[]) => void;
}

export function MetricSelector({ onChange }: MetricSelectorProps) {
  const [selected, setSelected] = useState<MetricKey[]>(DEFAULT_METRIC_KEYS);

  function toggle(key: MetricKey): void {
    const next = selected.includes(key)
      ? selected.filter((selectedKey) => selectedKey !== key)
      : [...selected, key];

    setSelected(next);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {_METRIC_OPTIONS.map((option) => (
        <label key={option.key} className="flex items-center gap-1.5 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={selected.includes(option.key)}
            onChange={() => toggle(option.key)}
            className="rounded border-slate-700 bg-slate-900"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
