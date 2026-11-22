import { describe, it, expect } from 'vitest';
import { computeMarketProfile, TRADING_HOURS } from '../src/profile/market-profile';
import { zonedStringToUtcSeconds } from '../src/feed/time';
import type { Bar } from '../src/model/bar';

const bar = (time: number, low: number, high: number): Bar => ({
  time, open: low, high, low, close: high, volume: 100,
});

describe('TRADING_HOURS presets (All Hours, Pakistan, London, New York)', () => {
  it('exposes only All Hours plus Pakistan, London, and New York presets', () => {
    expect(Object.keys(TRADING_HOURS).sort()).toEqual([
      'all-hours', 'london', 'new-york', 'pakistan', 'us-regular',
    ]);
    expect(TRADING_HOURS['all-hours'].zone).toBeUndefined();
    expect(TRADING_HOURS['pakistan']).toMatchObject({ startMinute: 570, endMinute: 930, zone: 'Asia/Karachi' });
    expect(TRADING_HOURS['london'].zone).toBe('Europe/London');
    expect(TRADING_HOURS['new-york'].zone).toBe('America/New_York');
    expect(TRADING_HOURS['us-regular']).toMatchObject({ startMinute: 570, endMinute: 960, zone: 'America/New_York' });
  });

  it('keeps a Pakistan (PSX) session consistent regardless of display timezone', () => {
    const d1 = zonedStringToUtcSeconds('2024-01-15 09:30:00', 'Asia/Karachi');
    const d2 = zonedStringToUtcSeconds('2024-01-16 09:30:00', 'Asia/Karachi');
    const bars = [
      bar(d1, 100, 104), bar(d1 + 3600, 102, 106),
      bar(d2, 101, 105), bar(d2 + 3600, 103, 107),
    ];
    const opts = { tickSize: 1, session: 'day' as const, blockMinutes: 30, window: TRADING_HOURS['pakistan'] };
    const utcView = computeMarketProfile(bars, opts);
    const nyView = computeMarketProfile(bars, { ...opts, timezone: 'America/New_York' });
    const lonView = computeMarketProfile(bars, { ...opts, timezone: 'Europe/London' });
    expect(utcView.sessions).toHaveLength(2);
    expect(nyView.sessions.map((s) => s.poc)).toEqual(utcView.sessions.map((s) => s.poc));
    expect(lonView.sessions.map((s) => s.poc)).toEqual(utcView.sessions.map((s) => s.poc));
  });
});
