import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { InvalidThresholdError, thresholdsService } from '../domains/thresholds/thresholdsService';
import { withAuth } from '../shared/middleware/withAuth';

const _THRESHOLDS_PATH = '/thresholds';
const _BAD_REQUEST_STATUS = 400;
const _INTERNAL_ERROR_STATUS = 500;

const _setThresholdsSchema = z.object({
  volatilityAlertPct: z.number(),
});

export const thresholdsRouter = Router();

thresholdsRouter.get(_THRESHOLDS_PATH, withAuth({ requires: ['metrics:read'] }), async (_req, res) => {
  let result: Response;

  try {
    const data = await thresholdsService.get();

    result = res.json({ data });
  } catch (error) {
    console.error('Failed to fetch thresholds:', error);
    result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
  }

  return result;
});

thresholdsRouter.put(_THRESHOLDS_PATH, withAuth({ requires: ['thresholds:write'] }), async (req, res) => {
  let result: Response;

  const parsedBody = _setThresholdsSchema.safeParse(req.body);

  if (!parsedBody.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_body' });
  } else {
    try {
      const data = await thresholdsService.set(parsedBody.data);

      result = res.json({ data });
    } catch (error) {
      if (error instanceof InvalidThresholdError) {
        result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_threshold' });
      } else {
        console.error('Failed to update thresholds:', error);
        result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
      }
    }
  }

  return result;
});
