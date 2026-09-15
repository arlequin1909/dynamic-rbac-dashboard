import { ROLE_PERMISSIONS } from '@app/shared';
import type { Role } from '@app/shared';
import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { auditService } from '../domains/audit/auditService';
import { withAuth } from '../shared/middleware/withAuth';

const _AUDIT_PATH = '/audit';
const _BAD_REQUEST_STATUS = 400;
const _INTERNAL_ERROR_STATUS = 500;

const _ROLE_VALUES = Object.keys(ROLE_PERMISSIONS) as [Role, ...Role[]];

const _listQuerySchema = z.object({
  action: z.string().min(1).optional(),
  role: z.enum(_ROLE_VALUES).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const auditRouter = Router();

auditRouter.get(_AUDIT_PATH, withAuth({ requires: ['audit:read'] }), async (req, res) => {
  let result: Response;

  const parsedQuery = _listQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_query' });
  } else {
    try {
      const data = await auditService.list(parsedQuery.data);

      result = res.json({ data });
    } catch (error) {
      console.error('Failed to fetch audit entries:', error);
      result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
    }
  }

  return result;
});
