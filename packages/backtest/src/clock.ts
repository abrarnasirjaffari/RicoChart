/**
 * Strictly monotonic simulated clock (UTC seconds).
 * Strategies receive this read-only interface instead of reading `Date.now()`,
 * ensuring deterministic, reproducible backtests.
 */
export interface ReadonlyClock {
  now(): number;
}

export class SimulatedClock implements ReadonlyClock {
  private _now: number;

  public constructor(initialSec = 0) {
    this._now = initialSec;
  }

  public now(): number {
    return this._now;
  }

  /** Advance the clock forward; throws if a caller tries to rewind time. */
  public advanceTo(timeSec: number): void {
    if (!Number.isFinite(timeSec)) throw new RangeError('SimulatedClock time must be finite');
    if (timeSec < this._now) {
      throw new RangeError(`SimulatedClock cannot move backwards (${timeSec} < ${this._now})`);
    }
    this._now = timeSec;
  }
}
