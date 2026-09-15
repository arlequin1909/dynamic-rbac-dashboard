import { Router } from 'express';
import { z } from 'zod';
import { marketsService } from '../domains/markets/marketsService';
import { withAuth } from '../shared/middleware/withAuth';

const _MARKETS_PATH = '/markets';
const _CHART_PATH = '/markets/:id/chart';
const _CURRENCIES_PATH = '/currencies';
const _DEFAULT_VS = 'usd';
const _DEFAULT_DAYS = '1';
const _MOCK_HEADER_NAME = 'X-Data-Source';
const _MOCK_HEADER_VALUE = 'mock';

const _marketsQuerySchema = z.object({
  vs: z.string().min(1).default(_DEFAULT_VS),
  ids: z.string().optional(),
});

const _chartParamsSchema = z.object({
  id: z.string().min(1),
});

const _chartQuerySchema = z.object({
  days: z.enum(['1', '7', '30']).default(_DEFAULT_DAYS),
});

export const marketsRouter = Router();

marketsRouter.get(
  _MARKETS_PATH,
  withAuth({ requires: ['metrics:read'] }),
  async (req, res, next) => {
    try {
      const query = _marketsQuerySchema.parse(req.query);
      const ids = query.ids
        ? query.ids
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined;

      const { data, source } = await marketsService.getMarkets({ vsCurrency: query.vs, ids });

      if (source === 'mock') {
        res.setHeader(_MOCK_HEADER_NAME, _MOCK_HEADER_VALUE);
      }

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

marketsRouter.get(_CHART_PATH, withAuth({ requires: ['metrics:read'] }), async (req, res, next) => {
  try {
    const params = _chartParamsSchema.parse(req.params);
    const query = _chartQuerySchema.parse(req.query);

    const { data } = await marketsService.getMarketChart({
      id: params.id,
      days: Number(query.days),
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

marketsRouter.get(
  _CURRENCIES_PATH,
  withAuth({ requires: ['metrics:read'] }),
  async (_req, res, next) => {
    try {
      const { data } = await marketsService.getSupportedVsCurrencies();

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);
