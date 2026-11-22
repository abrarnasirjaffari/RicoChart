import { impactRank, type BlackoutStatus, type ChartEventMarker, type EventImpact, type MacroEvent } from './types';

export interface MacroCalendarOptions {
  /** Default pre-event blackout minutes for high-impact events when not set per event. Default 15. */
  readonly defaultBlackoutBeforeMinutes?: number;
  /** Default post-event blackout minutes for high-impact events when not set per event. Default 15. */
  readonly defaultBlackoutAfterMinutes?: number;
}

/**
 * Scheduled Macro & Big Events Calendar (FOMC meetings, CPI, NFP, central bank
 * rate decisions, earnings). Provides upcoming countdowns, pre/post-event
 * blackout window checks for execution risk guards, and chart marker projection.
 */
export class MacroCalendar {
  private readonly _events = new Map<string, MacroEvent>();
  private readonly _defaultBeforeMin: number;
  private readonly _defaultAfterMin: number;

  public constructor(options: MacroCalendarOptions = {}) {
    this._defaultBeforeMin = options.defaultBlackoutBeforeMinutes ?? 15;
    this._defaultAfterMin = options.defaultBlackoutAfterMinutes ?? 15;
  }

  public addEvents(events: readonly MacroEvent[]): void {
    for (const ev of events) {
      this._events.set(ev.id, {
        ...ev,
        ...(ev.symbols ? { symbols: [...ev.symbols] } : {}),
      });
    }
  }

  public removeEvent(id: string): boolean {
    return this._events.delete(id);
  }

  /** List events occurring in `[nowSec, nowSec + horizonSec]`, sorted soonest-first. */
  public upcoming(nowSec: number, horizonSec: number, minImpact: EventImpact = 'low'): MacroEvent[] {
    const minRank = impactRank(minImpact);
    const end = nowSec + Math.max(0, horizonSec);
    const out: MacroEvent[] = [];
    for (const ev of this._events.values()) {
      if (ev.time < nowSec || ev.time > end) continue;
      if (impactRank(ev.impact) < minRank) continue;
      out.push(ev);
    }
    return out.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
  }

  /**
   * Check whether a symbol/region is currently inside a high-impact event
   * blackout window at `nowSec` (used by pure-code RiskGuard to avoid entries
   * right around FOMC/CPI/earnings).
   */
  public blackoutStatus(nowSec: number, scope?: { symbol?: string; region?: string; minImpact?: EventImpact }): BlackoutStatus {
    const minRank = impactRank(scope?.minImpact ?? 'high');
    const sym = scope?.symbol?.trim().toUpperCase();
    const region = scope?.region?.trim().toUpperCase();

    let blocking: MacroEvent | null = null;
    let maxRemaining = 0;

    for (const ev of this._events.values()) {
      if (impactRank(ev.impact) < minRank) continue;
      if (!this._matchesScope(ev, sym, region)) continue;

      const beforeSec = (ev.blackoutBeforeMinutes ?? this._defaultBeforeMin) * 60;
      const afterSec = (ev.blackoutAfterMinutes ?? this._defaultAfterMin) * 60;
      const start = ev.time - beforeSec;
      const end = ev.time + afterSec;

      if (nowSec >= start && nowSec <= end) {
        const rem = end - nowSec;
        if (rem >= maxRemaining) {
          maxRemaining = rem;
          blocking = ev;
        }
      }
    }

    return {
      active: blocking !== null,
      event: blocking,
      remainingSec: maxRemaining,
    };
  }

  /** Project calendar events in `[fromSec, toSec]` to RicoChart timeline markers. */
  public toChartMarkers(fromSec: number, toSec: number, minImpact: EventImpact = 'medium'): ChartEventMarker[] {
    const minRank = impactRank(minImpact);
    const out: ChartEventMarker[] = [];
    for (const ev of this._events.values()) {
      if (ev.time < fromSec || ev.time > toSec) continue;
      if (impactRank(ev.impact) < minRank) continue;
      const details = [
        ev.forecast !== undefined ? `Forecast: ${ev.forecast}` : null,
        ev.previous !== undefined ? `Previous: ${ev.previous}` : null,
        ev.actual !== undefined ? `Actual: ${ev.actual}` : null,
      ].filter(Boolean).join(' · ');
      out.push({
        id: ev.id,
        time: ev.time,
        title: ev.title,
        category: ev.category,
        impact: ev.impact,
        region: ev.region,
        summary: details || `${ev.region} ${ev.category} (${ev.impact} impact)`,
      });
    }
    return out.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
  }

  private _matchesScope(ev: MacroEvent, sym?: string, region?: string): boolean {
    if (sym && ev.symbols && ev.symbols.length > 0) {
      return ev.symbols.some((s) => s.toUpperCase() === sym);
    }
    if (region && ev.region.toUpperCase() !== 'GLOBAL') {
      return ev.region.toUpperCase() === region;
    }
    return true;
  }
}
