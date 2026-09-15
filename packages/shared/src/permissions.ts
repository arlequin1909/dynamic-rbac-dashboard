import type { Permission, Role } from './types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ['metrics:read'],
  trader: ['metrics:read', 'watchlist:read', 'watchlist:write'],
  admin: [
    'metrics:read',
    'watchlist:read',
    'watchlist:write',
    'audit:read',
    'thresholds:write',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  let result = false;

  if (ROLE_PERMISSIONS[role].includes(permission)) {
    result = true;
  }

  return result;
}

export function hasAllPermissions(role: Role, required: Permission[]): boolean {
  let result = true;

  for (const permission of required) {
    if (!hasPermission(role, permission)) {
      result = false;
      break;
    }
  }

  return result;
}
