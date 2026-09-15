import { randomUUID } from 'node:crypto';
import type { AuditEntry, Role } from '@app/shared';
import type { AuditListFilters } from '../../repositories/auditRepository';
import { auditRepository } from '../../repositories/auditRepository';
import { AppError } from '../../shared/middleware/errorHandler';

const _SENSITIVE_KEY_PATTERN = /token|secret|password|cookie/i;

export interface RecordAuditEntryOptions {
  actorSub: string;
  actorRole: Role;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined;

  if (metadata) {
    result = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (!_SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = value;
      }
    }
  }

  return result;
}

export const auditService = {
  record(options: RecordAuditEntryOptions): void {
    try {
      const entry: AuditEntry = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        actorSub: options.actorSub,
        actorRole: options.actorRole,
        action: options.action,
        resource: options.resource,
        metadata: sanitizeMetadata(options.metadata),
      };

      auditRepository.record(entry);
    } catch (error) {
      console.error('Failed to record audit entry:', error);
    }
  },

  async list(filters: AuditListFilters): Promise<AuditEntry[]> {
    let result: AuditEntry[];

    try {
      result = auditRepository.list(filters);
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error('Failed to list audit entries:', error);
      }

      throw error;
    }

    return result;
  },
};
