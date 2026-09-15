import type { Permission } from '@app/shared';
import { hasAllPermissions } from '@app/shared';
import type { ReactNode } from 'react';
import { ErrorState } from '../feedback/ErrorState';
import { useSession } from '../../hooks/useSession';

const _SESSION_ERROR_MESSAGE = 'Could not verify your session.';

interface RoleGateProps {
  requires: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ requires, fallback, children }: RoleGateProps): ReactNode {
  const { session, error, isLoading, mutate } = useSession();

  let result: ReactNode;

  if (isLoading) {
    result = null;
  } else if (error) {
    result = <ErrorState message={_SESSION_ERROR_MESSAGE} onRetry={() => mutate()} />;
  } else if (session && hasAllPermissions(session.role, requires)) {
    result = children;
  } else {
    result = fallback ?? null;
  }

  return result;
}
