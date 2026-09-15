import type { ReactNode } from 'react';
import useSWR from 'swr';
import { UnauthorizedNotice } from '../auth/UnauthorizedNotice';
import { ErrorState } from '../feedback/ErrorState';
import { ApiError, apiClient } from '../../lib/apiClient';

const _CURRENCIES_PATH = '/api/currencies';
const _FALLBACK_CURRENCIES = ['usd'];
const _FORBIDDEN_STATUS = 403;
const _ERROR_MESSAGE = 'Could not load currencies.';

async function fetchCurrencies(path: string): Promise<string[]> {
  const response = await apiClient.get<{ data: string[] }>(path);
  const result = response.data;

  return result;
}

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const { data, error, mutate } = useSWR(_CURRENCIES_PATH, fetchCurrencies);
  const currencies = data && data.length > 0 ? data : _FALLBACK_CURRENCIES;

  let result: ReactNode;

  if (error instanceof ApiError && error.status === _FORBIDDEN_STATUS) {
    result = <UnauthorizedNotice />;
  } else if (error) {
    result = <ErrorState message={_ERROR_MESSAGE} onRetry={() => mutate()} />;
  } else {
    result = (
      <select
        aria-label="Quote currency"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
      >
        {currencies.map((currency) => (
          <option key={currency} value={currency}>
            {currency.toUpperCase()}
          </option>
        ))}
      </select>
    );
  }

  return result;
}
