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
  private readonly _strict: boolean;

  public constructor(initialSec = 0, options?: { strict?: boolean }) {
    this._now = initialSec;
    this._strict = options?.strict ?? false;
  }

  public now(): number {
    return this._now;
  }

  /** Advance the clock forward; throws if a caller tries to rewind time. */
  public advanceTo(timeSec: number): void {
    if (!Number.isFinite(timeSec)) throw new RangeError('SimulatedClock time must be finite');
    if (this._strict && timeSec <= this._now) {
      throw new RangeError(
        `SimulatedClock cannot advance to a non-increasing time in strict mode (${timeSec} <= ${this._now})`,
      );
    }
    if (timeSec < this._now) {
      throw new RangeError(`SimulatedClock cannot move backwards (${timeSec} < ${this._now})`);
    }
    this._now = timeSec;
  }
}
