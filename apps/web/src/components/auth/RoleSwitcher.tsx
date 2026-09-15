import type { Role } from '@app/shared';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { apiClient } from '../../lib/apiClient';

const _DEFAULT_ROLE: Role = 'viewer';
const _LOGIN_PATH = '/api/auth/login';
const _ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'trader', label: 'Trader' },
  { value: 'admin', label: 'Admin' },
];

export function RoleSwitcher() {
  const { session, mutate } = useSession();
  const [selected, setSelected] = useState<Role>(session?.role ?? _DEFAULT_ROLE);

  useEffect(() => {
    if (session) {
      setSelected(session.role);
    }
  }, [session]);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>): Promise<void> {
    const role = event.target.value as Role;

    setSelected(role);
    await apiClient.post(_LOGIN_PATH, { role });
    await mutate();
  }

  return (
    <select
      aria-label="Active role"
      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
      value={selected}
      onChange={handleChange}
    >
      {_ROLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
