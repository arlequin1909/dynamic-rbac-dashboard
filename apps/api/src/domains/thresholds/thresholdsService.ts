import { z } from 'zod';
import type { ThresholdsState } from '../../repositories/thresholdsRepository';
import { thresholdsRepository } from '../../repositories/thresholdsRepository';

const _MIN_VOLATILITY_ALERT_PCT = 0.1;
const _MAX_VOLATILITY_ALERT_PCT = 100;

const _thresholdsSchema = z.object({
  volatilityAlertPct: z.number().min(_MIN_VOLATILITY_ALERT_PCT).max(_MAX_VOLATILITY_ALERT_PCT),
});

export class InvalidThresholdError extends Error {
  constructor(message = 'Invalid threshold value') {
    super(message);
    this.name = 'InvalidThresholdError';
  }
}

export const thresholdsService = {
  async get(): Promise<ThresholdsState> {
    let result: ThresholdsState;

    try {
      result = thresholdsRepository.get();
    } catch (error) {
      console.error('Failed to get thresholds:', error);
      throw error;
    }

    return result;
  },

  async set(next: ThresholdsState): Promise<ThresholdsState> {
    let result: ThresholdsState;

    try {
      const parsed = _thresholdsSchema.safeParse(next);

      if (!parsed.success) {
        throw new InvalidThresholdError();
      }

      thresholdsRepository.set(parsed.data);
      result = thresholdsRepository.get();
    } catch (error) {
      if (!(error instanceof InvalidThresholdError)) {
        console.error('Failed to set thresholds:', error);
      }

      throw error;
    }

    return result;
  },
};
