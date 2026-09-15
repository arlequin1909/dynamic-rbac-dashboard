import type { Permission } from '@app/shared';
import { hasAllPermissions } from '@app/shared';
import type { ReactNode } from 'react';
import { useSession } from '../../hooks/useSession';

interface RoleGateProps {
  requires: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ requires, fallback, children }: RoleGateProps): ReactNode {
  const { session, isLoading } = useSession();

  let result: ReactNode;

  if (isLoading) {
    result = null;
  } else if (session && hasAllPermissions(session.role, requires)) {
    result = children;
  } else {
    result = fallback ?? null;
  }

  return result;
}
