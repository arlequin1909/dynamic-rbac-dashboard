export type Role = 'viewer' | 'trader' | 'admin';

export type Permission =
  | 'metrics:read'
  | 'watchlist:read'
  | 'watchlist:write'
  | 'audit:read'
  | 'thresholds:write';

export interface Session {
  sub: string;
  role: Role;
}
