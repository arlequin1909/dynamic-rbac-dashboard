import { z } from 'zod';
import { _MAX_WATCHLIST_SIZE, watchlistRepository } from '../../repositories/watchlistRepository';
import { AppError, ConflictError, ValidationError } from '../../shared/middleware/errorHandler';

const _ID_PATTERN = /^[a-z0-9-]+$/;

const _watchlistIdSchema = z.string().min(1).max(100).regex(_ID_PATTERN);

export const watchlistService = {
  async list(sub: string): Promise<string[]> {
    let result: string[];

    try {
      result = watchlistRepository.list(sub);
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error('Failed to list watchlist:', error);
      }

      throw error;
    }

    return result;
  },

  async add(sub: string, id: string): Promise<string[]> {
    let result: string[];

    try {
      const parsed = _watchlistIdSchema.safeParse(id);

      if (!parsed.success) {
        throw new ValidationError('Invalid watchlist id');
      }

      const current = watchlistRepository.list(sub);

      if (current.includes(parsed.data)) {
        throw new ConflictError('Item already in watchlist');
      }

      if (current.length >= _MAX_WATCHLIST_SIZE) {
        throw new ConflictError('Watchlist size limit exceeded');
      }

      watchlistRepository.add(sub, parsed.data);
      result = watchlistRepository.list(sub);
    } catch (error) {
      if (!(error instanceof AppError)) {
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
        throw new ValidationError('Invalid watchlist id');
      }

      watchlistRepository.remove(sub, parsed.data);
      result = watchlistRepository.list(sub);
    } catch (error) {
      if (!(error instanceof AppError)) {
        console.error('Failed to remove watchlist item:', error);
      }

      throw error;
    }

    return result;
  },
};
