import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { RateLimitedError } from '../repositories/coinGeckoRepository';
import { marketsService } from '../domains/markets/marketsService';
import { withAuth } from '../shared/middleware/withAuth';

const _MARKETS_PATH = '/markets';
const _CHART_PATH = '/markets/:id/chart';
const _CURRENCIES_PATH = '/currencies';
const _DEFAULT_VS = 'usd';
const _DEFAULT_DAYS = '1';
const _BAD_REQUEST_STATUS = 400;
const _SERVICE_UNAVAILABLE_STATUS = 503;
const _INTERNAL_ERROR_STATUS = 500;
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

marketsRouter.get(_MARKETS_PATH, withAuth({ requires: ['metrics:read'] }), async (req, res) => {
  let result: Response;

  const parsedQuery = _marketsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_query' });
  } else {
    try {
      const ids = parsedQuery.data.ids
        ? parsedQuery.data.ids.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined;

      const { data, source } = await marketsService.getMarkets({
        vsCurrency: parsedQuery.data.vs,
        ids,
      });

      if (source === 'mock') {
        res.setHeader(_MOCK_HEADER_NAME, _MOCK_HEADER_VALUE);
      }

      result = res.json({ data });
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
    }
  }

  return result;
});

marketsRouter.get(_CHART_PATH, withAuth({ requires: ['metrics:read'] }), async (req, res) => {
  let result: Response;

  const parsedParams = _chartParamsSchema.safeParse(req.params);
  const parsedQuery = _chartQuerySchema.safeParse(req.query);

  if (!parsedParams.success || !parsedQuery.success) {
    result = res.status(_BAD_REQUEST_STATUS).json({ error: 'invalid_request' });
  } else {
    try {
      const { data } = await marketsService.getMarketChart({
        id: parsedParams.data.id,
        days: Number(parsedQuery.data.days),
      });

      result = res.json({ data });
    } catch (error) {
      if (error instanceof RateLimitedError) {
        result = res.status(_SERVICE_UNAVAILABLE_STATUS).json({ error: 'rate_limited' });
      } else {
        console.error('Failed to fetch market chart:', error);
        result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
      }
    }
  }

  return result;
});

marketsRouter.get(_CURRENCIES_PATH, withAuth({ requires: ['metrics:read'] }), async (_req, res) => {
  let result: Response;

  try {
    const { data } = await marketsService.getSupportedVsCurrencies();

    result = res.json({ data });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      result = res.status(_SERVICE_UNAVAILABLE_STATUS).json({ error: 'rate_limited' });
    } else {
      console.error('Failed to fetch supported currencies:', error);
      result = res.status(_INTERNAL_ERROR_STATUS).json({ error: 'internal_error' });
    }
  }

  return result;
});
