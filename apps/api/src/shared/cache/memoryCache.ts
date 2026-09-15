interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class MemoryCache {
  private readonly store = new Map<string, CacheEntry>();

  get<T>(key: string): T | undefined {
    let result: T | undefined;

    const entry = this.store.get(key);

    if (entry) {
      if (Date.now() >= entry.expiresAt) {
        this.store.delete(key);
      } else {
        result = entry.value as T;
      }
    }

    return result;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
