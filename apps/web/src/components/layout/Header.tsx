import { RoleSwitcher } from '../auth/RoleSwitcher';

const _APP_TITLE = 'Financial Dashboard';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
      <h1 className="text-lg font-semibold text-slate-100">{_APP_TITLE}</h1>
      <RoleSwitcher />
    </header>
  );
}
