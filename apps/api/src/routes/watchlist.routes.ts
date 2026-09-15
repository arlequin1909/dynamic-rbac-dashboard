import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { auditService } from '../domains/audit/auditService';
import {
  DuplicateWatchlistItemError,
  InvalidWatchlistIdError,
  WatchlistLimitExceededError,
  watchlistService,
} from '../domains/watchlist/watchlistService';
import { withAuth } from '../shared/middleware/withAuth';

const _WATCHLIST_PATH = '/watchlist';
const _WATCHLIST_ITEM_PATH = '/watchlist/:id';
const _BAD_REQUEST_STATUS = 400;
const _UNAUTHORIZED_STATUS = 401;
const _CONFLICT_STATUS = 409;
const _INTERNAL_ERROR_STATUS = 500;

const _addBodySchema = z.object({
  id: z.string().min(1),
});

const _itemParamsSchema = z.object({
  id: z.string().min(1),
});

export const watchlistRouter = Router();

watchlistRouter.get(_WATCHLIST_PATH, withAuth({ requires: ['watchlist:read'] }), async (req, res) => {
  let result: Response;

  if (!req.session) {
    result = res.status(_UNAUTHORIZED_STATUS).json({ error: 'unauthorized' });
  } else {
    try {
      const data = await watchlistService.list(req.session.sub);

      result = res.json({ data });
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
      result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
    }
  }

  return result;
});

watchlistRouter.post(_WATCHLIST_PATH, withAuth({ requires: ['watchlist:write'] }), async (req, res) => {
  let result: Response;

  const parsedBody = _addBodySchema.safeParse(req.body);

  if (!req.session) {
    result = res.status(_UNAUTHORIZED_STATUS).json({ error: 'unauthorized' });
  } else if (!parsedBody.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_body' });
  } else {
    try {
      const data = await watchlistService.add(req.session.sub, parsedBody.data.id);

      auditService.record({
        actorSub: req.session.sub,
        actorRole: req.session.role,
        action: 'watchlist.add',
        metadata: { assetId: parsedBody.data.id },
      });

      result = res.json({ data });
    } catch (error) {
      if (error instanceof InvalidWatchlistIdError) {
        result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_id' });
      } else if (error instanceof DuplicateWatchlistItemError) {
        result = res.status(_CONFLICT_STATUS).json({ error: 'duplicate' });
      } else if (error instanceof WatchlistLimitExceededError) {
        result = res.status(_CONFLICT_STATUS).json({ error: 'limit_exceeded' });
      } else {
        console.error('Failed to add watchlist item:', error);
        result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
      }
    }
  }

  return result;
});

watchlistRouter.delete(_WATCHLIST_ITEM_PATH, withAuth({ requires: ['watchlist:write'] }), async (req, res) => {
  let result: Response;

  const parsedParams = _itemParamsSchema.safeParse(req.params);

  if (!req.session) {
    result = res.status(_UNAUTHORIZED_STATUS).json({ error: 'unauthorized' });
  } else if (!parsedParams.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_id' });
  } else {
    try {
      const data = await watchlistService.remove(req.session.sub, parsedParams.data.id);

      auditService.record({
        actorSub: req.session.sub,
        actorRole: req.session.role,
        action: 'watchlist.remove',
        metadata: { assetId: parsedParams.data.id },
      });

      result = res.json({ data });
    } catch (error) {
      if (error instanceof InvalidWatchlistIdError) {
        result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_id' });
      } else {
        console.error('Failed to remove watchlist item:', error);
        result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
      }
    }
  }

  return result;
});
