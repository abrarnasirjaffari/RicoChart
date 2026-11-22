import type { MacroCalendar } from '@rico-chart/events';
import type { WakeUpEvent, WatchBar, WatchRule } from './types';

interface RuleRuntime {
  rule: WatchRule;
  lastFiredAt: number | null;
  lastZoneInside: boolean;
  firedMacroIds: Set<string>;
}

/**
 * Pure-code, event-driven Alert Watchdog.
 * Runs cheaply on every bar/tick so AI agents remain completely asleep (0 tokens)
 * during quiet markets and only wake with a compact `WakeUpEvent` when a real
 * level cross, zone touch, volatility spike, or macro meeting countdown occurs.
 */
export class AlertWatchdog {
  private readonly _rules = new Map<string, RuleRuntime>();
  private readonly _lastClose = new Map<string, number>();

  public addRule(rule: WatchRule): void {
    this._rules.set(rule.id, {
      rule,
      lastFiredAt: null,
      lastZoneInside: false,
      firedMacroIds: new Set(),
    });
  }

  public removeRule(id: string): boolean {
    return this._rules.delete(id);
  }

  public rules(): WatchRule[] {
    return [...this._rules.values()].map((r) => r.rule);
  }

  /**
   * Evaluate all price/zone/volatility rules against an incoming market bar.
   * Returns an empty array when nothing meaningful happened (AI stays asleep).
   */
  public onBar(bar: WatchBar): WakeUpEvent[] {
    const symKey = bar.symbol.toUpperCase();
    const prevClose = this._lastClose.get(symKey);
    const events: WakeUpEvent[] = [];

    for (const rt of this._rules.values()) {
      const { rule } = rt;
      if (rule.enabled === false) continue;
      if (rule.symbol !== '*' && rule.symbol.toUpperCase() !== symKey) continue;
      if (!this._cooldownClear(rt, bar.time)) continue;

      const c = rule.condition;
      let reason: string | null = null;

      if (c.kind === 'price-cross-above') {
        const ref = prevClose ?? bar.open;
        if (ref <= c.level && bar.close > c.level) {
          reason = `${bar.symbol} crossed above ${c.level} (close ${bar.close})`;
        }
      } else if (c.kind === 'price-cross-below') {
        const ref = prevClose ?? bar.open;
        if (ref >= c.level && bar.close < c.level) {
          reason = `${bar.symbol} crossed below ${c.level} (close ${bar.close})`;
        }
      } else if (c.kind === 'zone-enter') {
        const inside = bar.low <= c.high && bar.high >= c.low;
        if (inside && !rt.lastZoneInside) {
          reason = `${bar.symbol} entered zone [${c.low}, ${c.high}]`;
        }
        rt.lastZoneInside = inside;
      } else if (c.kind === 'percent-move') {
        const ref = prevClose ?? bar.open;
        if (ref > 0) {
          const movePct = Math.abs((bar.close - ref) / ref) * 100;
          if (movePct >= c.thresholdPct) {
            reason = `${bar.symbol} moved ${movePct.toFixed(2)}% (>= ${c.thresholdPct}%)`;
          }
        }
      }

      if (reason !== null) {
        rt.lastFiredAt = bar.time;
        if (rule.once) rt.rule = { ...rule, enabled: false };
        events.push({
          ruleId: rule.id,
          symbol: bar.symbol,
          label: rule.label,
          priority: rule.priority,
          time: bar.time,
          reason,
          price: bar.close,
        });
      }
    }

    this._lastClose.set(symKey, bar.close);
    return events;
  }

  /**
   * Evaluate scheduled macro-event countdown rules (e.g., wake AI 15m before FOMC/CPI).
   * Each macro event fires at most once per rule (deduplicated by macro event id).
   */
  public checkMacroEvents(calendar: MacroCalendar, nowSec: number): WakeUpEvent[] {
    const events: WakeUpEvent[] = [];

    for (const rt of this._rules.values()) {
      const { rule } = rt;
      if (rule.enabled === false) continue;
      if (rule.condition.kind !== 'macro-event-countdown') continue;

      const { leadSec, minImpact, region } = rule.condition;
      const upcoming = calendar.upcoming(nowSec, leadSec, minImpact);

      for (const macro of upcoming) {
        if (region && macro.region.toUpperCase() !== 'GLOBAL' && macro.region.toUpperCase() !== region.toUpperCase()) {
          continue;
        }
        if (rt.firedMacroIds.has(macro.id)) continue;
        rt.firedMacroIds.add(macro.id);
        rt.lastFiredAt = nowSec;
        if (rule.once) rt.rule = { ...rule, enabled: false };

        const minsAway = Math.max(0, Math.round((macro.time - nowSec) / 60));
        events.push({
          ruleId: rule.id,
          symbol: rule.symbol,
          label: rule.label,
          priority: rule.priority,
          time: nowSec,
          reason: `Upcoming ${macro.impact}-impact event: ${macro.title} in ${minsAway}m`,
          macroEvent: macro,
        });
      }
    }

    return events;
  }

  private _cooldownClear(rt: RuleRuntime, nowSec: number): boolean {
    if (rt.lastFiredAt === null) return true;
    const cooldown = rt.rule.cooldownSec ?? 300;
    return nowSec - rt.lastFiredAt >= cooldown;
  }
}
