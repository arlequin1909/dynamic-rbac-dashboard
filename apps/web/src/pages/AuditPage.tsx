import type { Permission } from '@app/shared';
import { RoleGate } from '../components/auth/RoleGate';
import { UnauthorizedNotice } from '../components/auth/UnauthorizedNotice';

const _REQUIRED_PERMISSIONS: Permission[] = ['audit:read'];

export function AuditPage() {
  return (
    <RoleGate requires={_REQUIRED_PERMISSIONS} fallback={<UnauthorizedNotice />}>
      <p className="text-slate-200">Audit - placeholder</p>
    </RoleGate>
  );
}
