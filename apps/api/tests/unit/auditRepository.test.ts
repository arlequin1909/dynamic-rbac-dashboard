import type { AuditEntry } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { _MAX_AUDIT_ENTRIES, auditRepository } from '../../src/repositories/auditRepository';

function buildEntry(id: string, overrides: Partial<AuditEntry> = {}): AuditEntry {
  const result: AuditEntry = {
    id,
    timestamp: new Date().toISOString(),
    actorSub: 'sub-1',
    actorRole: 'admin',
    action: 'test.action',
    ...overrides,
  };

  return result;
}

describe('auditRepository', () => {
  it('lists recorded entries most-recent-first', () => {
    auditRepository.record(buildEntry('order-1'));
    auditRepository.record(buildEntry('order-2'));
    auditRepository.record(buildEntry('order-3'));

    const entries = auditRepository.list({});
    const ids = entries.slice(0, 3).map((entry) => entry.id);

    expect(ids).toEqual(['order-3', 'order-2', 'order-1']);
  });

  it('filters by action and role', () => {
    auditRepository.record(buildEntry('filter-1', { action: 'watchlist.add', actorRole: 'trader' }));
    auditRepository.record(buildEntry('filter-2', { action: 'watchlist.remove', actorRole: 'trader' }));

    const byAction = auditRepository.list({ action: 'watchlist.add' });
    const byRole = auditRepository.list({ role: 'trader' });

    expect(byAction.some((entry) => entry.id === 'filter-1')).toBe(true);
    expect(byAction.every((entry) => entry.action === 'watchlist.add')).toBe(true);
    expect(byRole.some((entry) => entry.id === 'filter-1' || entry.id === 'filter-2')).toBe(true);
  });

  it('respects the limit option', () => {
    auditRepository.record(buildEntry('limit-1'));
    auditRepository.record(buildEntry('limit-2'));

    const limited = auditRepository.list({ limit: 1 });

    expect(limited).toHaveLength(1);
  });

  it('evicts the oldest entries once capacity is exceeded', () => {
    for (let i = 0; i < _MAX_AUDIT_ENTRIES + 5; i += 1) {
      auditRepository.record(buildEntry(`capacity-${i}`));
    }

    const entries = auditRepository.list({});
    const ids = entries.map((entry) => entry.id);

    expect(entries.length).toBeLessThanOrEqual(_MAX_AUDIT_ENTRIES);
    expect(ids).toContain(`capacity-${_MAX_AUDIT_ENTRIES + 4}`);
    expect(ids).not.toContain('capacity-0');
  });
});
