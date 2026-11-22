import { describe, expect, it } from 'vitest';
import { MacroCalendar } from '@rico-chart/events';
import { AlertWatchdog } from '../src/index';

describe('AlertWatchdog', () => {
  it('stays completely silent on quiet bars and wakes once on level cross with cooldown', () => {
    const wd = new AlertWatchdog();
    wd.addRule({
      id: 'breakout-100',
      symbol: 'BTCUSDT',
      label: 'Key resistance breakout',
      priority: 'high',
      cooldownSec: 600,
      condition: { kind: 'price-cross-above', level: 100 },
    });

    // Quiet bars below 100 -> 0 wake-ups (AI sleeps)
    expect(wd.onBar({ symbol: 'BTCUSDT', interval: '5m', time: 1000, open: 95, high: 98, low: 94, close: 97 })).toEqual([]);
    expect(wd.onBar({ symbol: 'BTCUSDT', interval: '5m', time: 1300, open: 97, high: 99, low: 96, close: 99 })).toEqual([]);

    // Breakout bar crosses 100 -> wakes AI once
    const fired = wd.onBar({ symbol: 'BTCUSDT', interval: '5m', time: 1600, open: 99, high: 103, low: 98.5, close: 102 });
    expect(fired).toHaveLength(1);
    expect(fired[0]!.ruleId).toBe('breakout-100');
    expect(fired[0]!.price).toBe(102);

    // Dip and re-cross inside cooldown window -> suppressed
    expect(wd.onBar({ symbol: 'BTCUSDT', interval: '5m', time: 1800, open: 102, high: 102, low: 98, close: 99 })).toEqual([]);
    expect(wd.onBar({ symbol: 'BTCUSDT', interval: '5m', time: 2000, open: 99, high: 104, low: 99, close: 103 })).toEqual([]);
  });

  it('wakes once ahead of scheduled high-impact macro meetings and deduplicates', () => {
    const cal = new MacroCalendar();
    const fomcTime = 1_770_000_000;
    cal.addEvents([
      { id: 'fomc', title: 'FOMC Meeting', category: 'central-bank', impact: 'high', time: fomcTime, region: 'USD' },
    ]);

    const wd = new AlertWatchdog();
    wd.addRule({
      id: 'macro-wake',
      symbol: '*',
      label: 'Pre-FOMC check',
      priority: 'critical',
      condition: { kind: 'macro-event-countdown', leadSec: 900, minImpact: 'high', region: 'USD' },
    });

    // 30m before -> silent
    expect(wd.checkMacroEvents(cal, fomcTime - 1800)).toEqual([]);
    // 10m before -> wakes once
    const first = wd.checkMacroEvents(cal, fomcTime - 600);
    expect(first).toHaveLength(1);
    expect(first[0]!.macroEvent?.id).toBe('fomc');
    // Next minute -> deduplicated, does not spam AI
    expect(wd.checkMacroEvents(cal, fomcTime - 540)).toEqual([]);
  });
});
