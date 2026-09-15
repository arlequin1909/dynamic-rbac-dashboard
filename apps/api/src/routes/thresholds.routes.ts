import { Router } from 'express';
import { z } from 'zod';
import { auditService } from '../domains/audit/auditService';
import { thresholdsService } from '../domains/thresholds/thresholdsService';
import { UnauthorizedError } from '../shared/middleware/errorHandler';
import { withAuth } from '../shared/middleware/withAuth';

const _THRESHOLDS_PATH = '/thresholds';

const _setThresholdsSchema = z.object({
  volatilityAlertPct: z.number(),
});

export const thresholdsRouter = Router();

thresholdsRouter.get(
  _THRESHOLDS_PATH,
  withAuth({ requires: ['metrics:read'] }),
  async (_req, res, next) => {
    try {
      const data = await thresholdsService.get();

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

thresholdsRouter.put(
  _THRESHOLDS_PATH,
  withAuth({ requires: ['thresholds:write'] }),
  async (req, res, next) => {
    try {
      if (!req.session) {
        throw new UnauthorizedError();
      }

      const body = _setThresholdsSchema.parse(req.body);
      const previous = await thresholdsService.get();
      const data = await thresholdsService.set(body);

      auditService.record({
        actorSub: req.session.sub,
        actorRole: req.session.role,
        action: 'thresholds.update',
        metadata: { previous: previous.volatilityAlertPct, next: data.volatilityAlertPct },
      });

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);
