import { useSession } from '../hooks/useSession';

const _NO_ROLE_LABEL = 'none';

export function DashboardPage() {
  const { session } = useSession();
  const roleLabel = session?.role ?? _NO_ROLE_LABEL;

  return <p className="text-slate-200">Dashboard - role: {roleLabel}</p>;
}
