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

export interface MarketDTO {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export interface ChartPoint {
  t: number;
  price: number;
}
