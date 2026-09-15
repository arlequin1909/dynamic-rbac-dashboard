import { z } from 'zod';
import { _MAX_WATCHLIST_SIZE, watchlistRepository } from '../../repositories/watchlistRepository';

const _ID_PATTERN = /^[a-z0-9-]+$/;

const _watchlistIdSchema = z.string().min(1).max(100).regex(_ID_PATTERN);

export class InvalidWatchlistIdError extends Error {
  constructor(message = 'Invalid watchlist id') {
    super(message);
    this.name = 'InvalidWatchlistIdError';
  }
}

export class DuplicateWatchlistItemError extends Error {
  constructor(message = 'Item already in watchlist') {
    super(message);
    this.name = 'DuplicateWatchlistItemError';
  }
}

export class WatchlistLimitExceededError extends Error {
  constructor(message = 'Watchlist size limit exceeded') {
    super(message);
    this.name = 'WatchlistLimitExceededError';
  }
}

function isExpectedWatchlistError(error: unknown): boolean {
  const result =
    error instanceof InvalidWatchlistIdError ||
    error instanceof DuplicateWatchlistItemError ||
    error instanceof WatchlistLimitExceededError;

  return result;
}

export const watchlistService = {
  async list(sub: string): Promise<string[]> {
    let result: string[];

    try {
      result = watchlistRepository.list(sub);
    } catch (error) {
      console.error('Failed to list watchlist:', error);
      throw error;
    }

    return result;
  },

  async add(sub: string, id: string): Promise<string[]> {
    let result: string[];

    try {
      const parsed = _watchlistIdSchema.safeParse(id);

      if (!parsed.success) {
        throw new InvalidWatchlistIdError();
      }

      const current = watchlistRepository.list(sub);

      if (current.includes(parsed.data)) {
        throw new DuplicateWatchlistItemError();
      }

      if (current.length >= _MAX_WATCHLIST_SIZE) {
        throw new WatchlistLimitExceededError();
      }

      watchlistRepository.add(sub, parsed.data);
      result = watchlistRepository.list(sub);
    } catch (error) {
      if (!isExpectedWatchlistError(error)) {
        console.error('Failed to add watchlist item:', error);
      }

      throw error;
    }

    return result;
  },

  async remove(sub: string, id: string): Promise<string[]> {
    let result: string[];

    try {
      const parsed = _watchlistIdSchema.safeParse(id);

      if (!parsed.success) {
        throw new InvalidWatchlistIdError();
      }

      watchlistRepository.remove(sub, parsed.data);
      result = watchlistRepository.list(sub);
    } catch (error) {
      if (!isExpectedWatchlistError(error)) {
        console.error('Failed to remove watchlist item:', error);
      }

      throw error;
    }

    return result;
  },
};
