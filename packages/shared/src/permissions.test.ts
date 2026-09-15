import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';
import type { Permission, Role } from './types';

const _ROLES: Role[] = ['viewer', 'trader', 'admin'];
const _PERMISSIONS: Permission[] = [
  'metrics:read',
  'watchlist:read',
  'watchlist:write',
  'audit:read',
  'thresholds:write',
];

const _EXPECTED: Record<Role, Record<Permission, boolean>> = {
  viewer: {
    'metrics:read': true,
    'watchlist:read': false,
    'watchlist:write': false,
    'audit:read': false,
    'thresholds:write': false,
  },
  trader: {
    'metrics:read': true,
    'watchlist:read': true,
    'watchlist:write': true,
    'audit:read': false,
    'thresholds:write': false,
  },
  admin: {
    'metrics:read': true,
    'watchlist:read': true,
    'watchlist:write': true,
    'audit:read': true,
    'thresholds:write': true,
  },
};

describe('hasPermission', () => {
  for (const role of _ROLES) {
    for (const permission of _PERMISSIONS) {
      const expected = _EXPECTED[role][permission];

      it(`role "${role}" ${expected ? 'has' : 'does not have'} permission "${permission}"`, () => {
        expect(hasPermission(role, permission)).toBe(expected);
      });
    }
  }
});
