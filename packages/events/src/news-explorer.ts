import { impactRank, type NewsFilter, type NewsItem } from './types';

/**
 * In-memory, deterministic News Explorer store.
 * Deduplicates incoming items by `id`, keeps newest-first ordering, and supports
 * fast symbol, impact, time-window, and keyword queries.
 */
export class NewsExplorer {
  private readonly _items = new Map<string, NewsItem>();

  /** Ingest one or more news items (deduplicated by `id`). Returns count of newly added items. */
  public ingest(items: readonly NewsItem[]): number {
    let added = 0;
    for (const item of items) {
      if (!this._items.has(item.id)) added++;
      this._items.set(item.id, {
        ...item,
        symbols: [...item.symbols],
      });
    }
    return added;
  }

  public size(): number {
    return this._items.size;
  }

  public clear(): void {
    this._items.clear();
  }

  /** Query stored news items, sorted newest-first. */
  public query(filter: NewsFilter = {}): NewsItem[] {
    const sym = filter.symbol?.trim().toUpperCase();
    const q = filter.query?.trim().toLowerCase();
    const minRank = filter.minImpact ? impactRank(filter.minImpact) : 0;
    const out: NewsItem[] = [];

    for (const item of this._items.values()) {
      if (minRank > 0 && impactRank(item.impact) < minRank) continue;
      if (filter.category && item.category !== filter.category) continue;
      if (filter.from !== undefined && item.time < filter.from) continue;
      if (filter.to !== undefined && item.time > filter.to) continue;
      if (sym && !item.symbols.some((s) => s.toUpperCase() === sym)) continue;
      if (q) {
        const hay = `${item.headline} ${item.summary ?? ''} ${item.source}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      out.push(item);
    }

    out.sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
    if (filter.limit !== undefined && filter.limit >= 0) {
      return out.slice(0, filter.limit);
    }
    return out;
  }
}
