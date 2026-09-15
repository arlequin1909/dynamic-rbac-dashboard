export const _MAX_WATCHLIST_SIZE = 50;

const _store = new Map<string, Set<string>>();

function getOrCreateSet(sub: string): Set<string> {
  let set = _store.get(sub);

  if (!set) {
    set = new Set<string>();
    _store.set(sub, set);
  }

  return set;
}

export const watchlistRepository = {
  list(sub: string): string[] {
    const set = _store.get(sub);
    const result = set ? Array.from(set) : [];

    return result;
  },

  add(sub: string, id: string): void {
    const set = getOrCreateSet(sub);

    set.add(id);
  },

  remove(sub: string, id: string): void {
    const set = _store.get(sub);

    if (set) {
      set.delete(id);
    }
  },
};
