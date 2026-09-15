import type { Permission } from '@app/shared';
import type { ReactNode } from 'react';
import useSWR from 'swr';
import { RoleGate } from '../auth/RoleGate';
import { UnauthorizedNotice } from '../auth/UnauthorizedNotice';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { ApiError, apiClient } from '../../lib/apiClient';

const _WATCHLIST_PATH = '/api/watchlist';
const _WRITE_PERMISSIONS: Permission[] = ['watchlist:write'];
const _FORBIDDEN_STATUS = 403;
const _EMPTY_MESSAGE = 'No assets in your watchlist yet.';
const _ERROR_MESSAGE = 'Could not load your watchlist.';

async function fetchWatchlist(path: string): Promise<string[]> {
  const response = await apiClient.get<{ data: string[] }>(path);
  const result = response.data;

  return result;
}

interface WatchlistProps {
  assetToAdd?: string | null;
}

export function Watchlist({ assetToAdd }: WatchlistProps) {
  const { data, error, isLoading, mutate } = useSWR(_WATCHLIST_PATH, fetchWatchlist);
  const items = data ?? [];

  async function handleAdd(id: string): Promise<void> {
    await mutate(
      async () => {
        const response = await apiClient.post<{ data: string[] }>(_WATCHLIST_PATH, { id });

        return response.data;
      },
      { optimisticData: [...items, id], rollbackOnError: true }
    );
  }

  async function handleRemove(id: string): Promise<void> {
    await mutate(
      async () => {
        const response = await apiClient.del<{ data: string[] }>(`${_WATCHLIST_PATH}/${id}`);

        return response.data;
      },
      { optimisticData: items.filter((item) => item !== id), rollbackOnError: true }
    );
  }

  let content: ReactNode;

  if (error instanceof ApiError && error.status === _FORBIDDEN_STATUS) {
    content = <UnauthorizedNotice />;
  } else if (error) {
    content = <ErrorState message={_ERROR_MESSAGE} onRetry={() => mutate()} />;
  } else if (isLoading) {
    content = <p className="text-sm text-slate-500">Loading…</p>;
  } else if (items.length === 0) {
    content = <EmptyState message={_EMPTY_MESSAGE} />;
  } else {
    content = (
      <ul className="space-y-1">
        {items.map((id) => (
          <li key={id} className="flex items-center justify-between text-sm text-slate-200">
            {id}
            <RoleGate requires={_WRITE_PERMISSIONS}>
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </RoleGate>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded border border-slate-800 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">Watchlist</h2>
      {content}
      {assetToAdd && !items.includes(assetToAdd) && (
        <RoleGate requires={_WRITE_PERMISSIONS}>
          <button
            type="button"
            onClick={() => handleAdd(assetToAdd)}
            className="mt-3 rounded bg-sky-600 px-2 py-1 text-sm text-white"
          >
            Add {assetToAdd} to watchlist
          </button>
        </RoleGate>
      )}
    </div>
  );
}
