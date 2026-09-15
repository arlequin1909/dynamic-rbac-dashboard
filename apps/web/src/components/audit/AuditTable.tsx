import type { AuditEntry, Role } from '@app/shared';
import type { ReactNode } from 'react';
import { useState } from 'react';
import useSWR from 'swr';
import { UnauthorizedNotice } from '../auth/UnauthorizedNotice';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { ApiError, apiClient } from '../../lib/apiClient';

const _AUDIT_BASE_PATH = '/api/audit';
const _ROLE_OPTIONS: Role[] = ['viewer', 'trader', 'admin'];
const _FORBIDDEN_STATUS = 403;
const _EMPTY_MESSAGE = 'No audit entries match this filter.';
const _ERROR_MESSAGE = 'Could not load the audit log.';

async function fetchAuditEntries(path: string): Promise<AuditEntry[]> {
  const response = await apiClient.get<{ data: AuditEntry[] }>(path);
  const result = response.data;

  return result;
}

function buildAuditKey(action: string, role: string): string {
  const params = new URLSearchParams();

  if (action) {
    params.set('action', action);
  }

  if (role) {
    params.set('role', role);
  }

  const query = params.toString();
  const result = query ? `${_AUDIT_BASE_PATH}?${query}` : _AUDIT_BASE_PATH;

  return result;
}

export function AuditTable() {
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const key = buildAuditKey(actionFilter, roleFilter);
  const { data, error, isLoading, mutate } = useSWR(key, fetchAuditEntries);
  const entries = data ?? [];

  let tableContent: ReactNode;

  if (error instanceof ApiError && error.status === _FORBIDDEN_STATUS) {
    tableContent = <UnauthorizedNotice />;
  } else if (error) {
    tableContent = <ErrorState message={_ERROR_MESSAGE} onRetry={() => mutate()} />;
  } else if (isLoading) {
    tableContent = <p className="text-sm text-slate-500">Loading…</p>;
  } else if (entries.length === 0) {
    tableContent = <EmptyState message={_EMPTY_MESSAGE} />;
  } else {
    tableContent = (
      <table className="w-full text-left text-sm text-slate-200">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className="py-2 pr-4 font-medium">Timestamp</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Action</th>
            <th className="py-2 pr-4 font-medium">Resource</th>
            <th className="py-2 pr-4 font-medium">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-900">
              <td className="py-2 pr-4 text-slate-400">
                {new Date(entry.timestamp).toLocaleString()}
              </td>
              <td className="py-2 pr-4">{entry.actorRole}</td>
              <td className="py-2 pr-4">{entry.action}</td>
              <td className="py-2 pr-4">{entry.resource ?? '—'}</td>
              <td className="py-2 pr-4 font-mono text-xs text-slate-400">
                {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-slate-400">
          Action
          <input
            type="text"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            placeholder="e.g. auth.login"
            className="mt-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          />
        </label>
        <label className="flex flex-col text-xs text-slate-400">
          Role
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="mt-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          >
            <option value="">All</option>
            {_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => mutate()}
          className="rounded bg-sky-600 px-3 py-1.5 text-sm text-white"
        >
          Refresh
        </button>
      </div>
      {tableContent}
    </div>
  );
}
