import type { Permission } from '@app/shared';
import { AuditTable } from '../components/audit/AuditTable';
import { RoleGate } from '../components/auth/RoleGate';
import { UnauthorizedNotice } from '../components/auth/UnauthorizedNotice';

const _REQUIRED_PERMISSIONS: Permission[] = ['audit:read'];

export function AuditPage() {
  return (
    <RoleGate requires={_REQUIRED_PERMISSIONS} fallback={<UnauthorizedNotice />}>
      <AuditTable />
    </RoleGate>
  );
}
