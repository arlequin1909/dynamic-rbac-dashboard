import type { AuditEntry, Role } from '@app/shared';

export const _MAX_AUDIT_ENTRIES = 500;

const _buffer: (AuditEntry | undefined)[] = new Array(_MAX_AUDIT_ENTRIES);
let _writeIndex = 0;
let _size = 0;

export interface AuditListFilters {
  action?: string;
  role?: Role;
  limit?: number;
}

function matchesFilters(entry: AuditEntry, filters: AuditListFilters): boolean {
  const matchesAction = !filters.action || entry.action === filters.action;
  const matchesRole = !filters.role || entry.actorRole === filters.role;
  const result = matchesAction && matchesRole;

  return result;
}

export const auditRepository = {
  record(entry: AuditEntry): void {
    _buffer[_writeIndex] = entry;
    _writeIndex = (_writeIndex + 1) % _MAX_AUDIT_ENTRIES;
    _size = Math.min(_size + 1, _MAX_AUDIT_ENTRIES);
  },

  list(filters: AuditListFilters): AuditEntry[] {
    const entries: AuditEntry[] = [];

    for (let offset = 0; offset < _size; offset += 1) {
      const index = (_writeIndex - 1 - offset + _MAX_AUDIT_ENTRIES) % _MAX_AUDIT_ENTRIES;
      const entry = _buffer[index];

      if (entry && matchesFilters(entry, filters)) {
        entries.push(entry);
      }
    }

    const result = filters.limit !== undefined ? entries.slice(0, filters.limit) : entries;

    return result;
  },
};
