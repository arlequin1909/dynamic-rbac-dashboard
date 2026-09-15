import { ROLE_PERMISSIONS } from '@app/shared';
import type { Role } from '@app/shared';
import { Router } from 'express';
import { z } from 'zod';
import { auditService } from '../domains/audit/auditService';
import { withAuth } from '../shared/middleware/withAuth';

const _AUDIT_PATH = '/audit';

const _ROLE_VALUES = Object.keys(ROLE_PERMISSIONS) as [Role, ...Role[]];

const _listQuerySchema = z.object({
  action: z.string().min(1).optional(),
  role: z.enum(_ROLE_VALUES).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const auditRouter = Router();

auditRouter.get(_AUDIT_PATH, withAuth({ requires: ['audit:read'] }), async (req, res, next) => {
  try {
    const query = _listQuerySchema.parse(req.query);
    const data = await auditService.list(query);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});
