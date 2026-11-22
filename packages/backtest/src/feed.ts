import type { ExecutionBar } from '@rico-chart/execution';

/**
 * Strictly causal read-only history view handed to strategies.
 * Physically prevents look-ahead: strategies can ONLY inspect closed bars
 * at indices `0 .. currentIndex` and never receive a reference to the backing array.
 */
export interface PointInTimeView {
  /** Number of closed bars visible so far (`currentIndex + 1`). */
  length(): number;
  /** Latest closed bar (`offset = 0`), or `offset` bars ago (`offset = 1` is previous bar). */
  bar(offset?: number): ExecutionBar | undefined;
  /** Copy of the last `count` closed bars in chronological order. */
  window(count: number): readonly ExecutionBar[];
}

export class PointInTimeFeed implements PointInTimeView {
  private readonly _all: readonly ExecutionBar[];
  private _cursor = -1;

  public constructor(bars: readonly ExecutionBar[]) {
    // Validate strict ascending chronological order upfront
    for (let i = 1; i < bars.length; i++) {
      if (bars[i]!.time < bars[i - 1]!.time) {
        throw new RangeError(`Backtest bars must be sorted chronologically (index ${i})`);
      }
    }
    this._all = bars.map((b) => Object.freeze({ ...b }));
  }

  public totalBars(): number {
    return this._all.length;
  }

  /** Internal runner hook to advance the causal frontier by one bar. */
  public advanceToIndex(index: number): ExecutionBar {
    if (index !== this._cursor + 1 || index >= this._all.length) {
      throw new RangeError(`Invalid causal advance to index ${index} (cursor=${this._cursor})`);
    }
    this._cursor = index;
    return this._all[index]!;
  }

  public length(): number {
    return this._cursor + 1;
  }

  public bar(offset = 0): ExecutionBar | undefined {
    if (!Number.isInteger(offset) || offset < 0) return undefined;
    const idx = this._cursor - offset;
    return idx >= 0 ? this._all[idx] : undefined;
  }

  public window(count: number): readonly ExecutionBar[] {
    if (this._cursor < 0 || count <= 0) return [];
    const start = Math.max(0, this._cursor + 1 - Math.floor(count));
    return this._all.slice(start, this._cursor + 1);
  }
}
