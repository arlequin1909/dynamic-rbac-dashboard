import { Router } from 'express';
import { z } from 'zod';
import { auditService } from '../domains/audit/auditService';
import { watchlistService } from '../domains/watchlist/watchlistService';
import { UnauthorizedError } from '../shared/middleware/errorHandler';
import { withAuth } from '../shared/middleware/withAuth';

const _WATCHLIST_PATH = '/watchlist';
const _WATCHLIST_ITEM_PATH = '/watchlist/:id';

const _addBodySchema = z.object({
  id: z.string().min(1),
});

const _itemParamsSchema = z.object({
  id: z.string().min(1),
});

export const watchlistRouter = Router();

watchlistRouter.get(
  _WATCHLIST_PATH,
  withAuth({ requires: ['watchlist:read'] }),
  async (req, res, next) => {
    try {
      if (!req.session) {
        throw new UnauthorizedError();
      }

      const data = await watchlistService.list(req.session.sub);

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

watchlistRouter.post(
  _WATCHLIST_PATH,
  withAuth({ requires: ['watchlist:write'] }),
  async (req, res, next) => {
    try {
      if (!req.session) {
        throw new UnauthorizedError();
      }

      const body = _addBodySchema.parse(req.body);
      const data = await watchlistService.add(req.session.sub, body.id);

      auditService.record({
        actorSub: req.session.sub,
        actorRole: req.session.role,
        action: 'watchlist.add',
        metadata: { assetId: body.id },
      });

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

watchlistRouter.delete(
  _WATCHLIST_ITEM_PATH,
  withAuth({ requires: ['watchlist:write'] }),
  async (req, res, next) => {
    try {
      if (!req.session) {
        throw new UnauthorizedError();
      }

      const params = _itemParamsSchema.parse(req.params);
      const data = await watchlistService.remove(req.session.sub, params.id);

      auditService.record({
        actorSub: req.session.sub,
        actorRole: req.session.role,
        action: 'watchlist.remove',
        metadata: { assetId: params.id },
      });

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);
