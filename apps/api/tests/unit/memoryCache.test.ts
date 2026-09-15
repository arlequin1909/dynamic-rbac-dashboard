import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryCache } from '../../src/shared/cache/memoryCache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value', () => {
    cache.set('key', 'value', 1000);

    expect(cache.get('key')).toBe('value');
  });

  it('returns undefined for a missing key', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires a value after its TTL elapses', () => {
    vi.useFakeTimers();
    cache.set('key', 'value', 100);

    vi.advanceTimersByTime(101);

    expect(cache.get('key')).toBeUndefined();
  });

  it('keeps a value alive before its TTL elapses', () => {
    vi.useFakeTimers();
    cache.set('key', 'value', 1000);

    vi.advanceTimersByTime(500);

    expect(cache.get('key')).toBe('value');
  });

  it('removes a value via delete', () => {
    cache.set('key', 'value', 1000);
    cache.delete('key');

    expect(cache.get('key')).toBeUndefined();
  });
});
