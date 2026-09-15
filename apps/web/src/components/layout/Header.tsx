import type { Permission } from '@app/shared';
import { Link } from 'react-router-dom';
import { RoleGate } from '../auth/RoleGate';
import { RoleSwitcher } from '../auth/RoleSwitcher';

const _APP_TITLE = 'Financial Dashboard';
const _AUDIT_PATH = '/admin/audit';
const _AUDIT_PERMISSIONS: Permission[] = ['audit:read'];

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
      <h1 className="text-lg font-semibold text-slate-100">{_APP_TITLE}</h1>
      <div className="flex items-center gap-4">
        <RoleGate requires={_AUDIT_PERMISSIONS}>
          <Link to={_AUDIT_PATH} className="text-sm text-slate-300 hover:text-slate-100">
            Audit log
          </Link>
        </RoleGate>
        <RoleSwitcher />
      </div>
    </header>
  );
}
