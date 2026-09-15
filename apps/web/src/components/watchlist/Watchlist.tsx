import type { Permission } from '@app/shared';
import useSWR from 'swr';
import { apiClient } from '../../lib/apiClient';
import { RoleGate } from '../auth/RoleGate';

const _WATCHLIST_PATH = '/api/watchlist';
const _WRITE_PERMISSIONS: Permission[] = ['watchlist:write'];

async function fetchWatchlist(path: string): Promise<string[]> {
  const response = await apiClient.get<{ data: string[] }>(path);
  const result = response.data;

  return result;
}

interface WatchlistProps {
  assetToAdd?: string | null;
}

export function Watchlist({ assetToAdd }: WatchlistProps) {
  const { data, mutate } = useSWR(_WATCHLIST_PATH, fetchWatchlist);
  const items = data ?? [];

  async function handleAdd(id: string): Promise<void> {
    await mutate(
      async () => {
        const response = await apiClient.post<{ data: string[] }>(_WATCHLIST_PATH, { id });

        return response.data;
      },
      { optimisticData: [...items, id], rollbackOnError: true },
    );
  }

  async function handleRemove(id: string): Promise<void> {
    await mutate(
      async () => {
        const response = await apiClient.del<{ data: string[] }>(`${_WATCHLIST_PATH}/${id}`);

        return response.data;
      },
      { optimisticData: items.filter((item) => item !== id), rollbackOnError: true },
    );
  }

  return (
    <div className="rounded border border-slate-800 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">Watchlist</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No assets yet.</p>
      ) : (
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
      )}
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
