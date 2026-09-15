import { useState } from 'react';
import { useThresholds } from '../../hooks/useThresholds';
import { apiClient } from '../../lib/apiClient';
import type { Thresholds } from '../../hooks/useThresholds';

const _THRESHOLDS_PATH = '/api/thresholds';
const _MIN_VALUE = 0.1;
const _MAX_VALUE = 100;
const _STEP = 0.1;

export function ThresholdsForm() {
  const { data, mutate } = useThresholds();
  const [draft, setDraft] = useState('');

  const inputValue = draft !== '' ? draft : (data?.volatilityAlertPct.toString() ?? '');

  async function handleSave(): Promise<void> {
    const parsed = Number(inputValue);

    if (!Number.isNaN(parsed)) {
      await mutate(
        async () => {
          const response = await apiClient.put<{ data: Thresholds }>(_THRESHOLDS_PATH, {
            volatilityAlertPct: parsed,
          });

          return response.data;
        },
        { optimisticData: { volatilityAlertPct: parsed }, rollbackOnError: true },
      );
      setDraft('');
    }
  }

  return (
    <div className="rounded border border-slate-800 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">Volatility alert threshold</h2>
      <div className="flex items-center gap-2">
        <input
          type="number"
          aria-label="Volatility alert threshold percentage"
          min={_MIN_VALUE}
          max={_MAX_VALUE}
          step={_STEP}
          value={inputValue}
          onChange={(event) => setDraft(event.target.value)}
          className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        />
        <span className="text-sm text-slate-400">%</span>
        <button
          type="button"
          onClick={handleSave}
          className="rounded bg-sky-600 px-3 py-1 text-sm text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
