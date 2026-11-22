import { describe, expect, it } from 'vitest';
import { MacroCalendar, NewsExplorer } from '../src/index';

describe('NewsExplorer', () => {
  it('deduplicates items and filters by symbol, impact, time, and keyword', () => {
    const news = new NewsExplorer();
    expect(news.ingest([
      { id: 'n1', headline: 'Fed signals steady rates', source: 'Wire', time: 1000, symbols: ['BTCUSDT', 'SPY'], impact: 'high', category: 'macro' },
      { id: 'n2', headline: 'Minor analyst note', source: 'Blog', time: 1100, symbols: ['BTCUSDT'], impact: 'low', category: 'commentary' },
      { id: 'n1', headline: 'Fed signals steady rates', source: 'Wire', time: 1000, symbols: ['BTCUSDT', 'SPY'], impact: 'high', category: 'macro' },
    ])).toBe(2);

    expect(news.size()).toBe(2);
    expect(news.query({ symbol: 'btcusdt', minImpact: 'high' }).map((n) => n.id)).toEqual(['n1']);
    expect(news.query({ query: 'steady' }).map((n) => n.id)).toEqual(['n1']);
    expect(news.query({ from: 1050 }).map((n) => n.id)).toEqual(['n2']);
  });
});

describe('MacroCalendar', () => {
  it('detects high-impact blackout windows around FOMC meetings and projects chart markers', () => {
    const cal = new MacroCalendar({ defaultBlackoutBeforeMinutes: 15, defaultBlackoutAfterMinutes: 10 });
    const fomcTime = 1_770_000_000;
    cal.addEvents([
      { id: 'fomc-1', title: 'FOMC Rate Decision', category: 'central-bank', impact: 'high', time: fomcTime, region: 'USD', forecast: '4.25%', previous: '4.50%' },
      { id: 'minor-1', title: 'Regional PMI', category: 'other', impact: 'low', time: fomcTime + 3600, region: 'USD' },
    ]);

    // 20 minutes before: not in blackout yet
    expect(cal.blackoutStatus(fomcTime - 20 * 60, { region: 'USD' }).active).toBe(false);
    // 10 minutes before: active blackout
    const status = cal.blackoutStatus(fomcTime - 10 * 60, { region: 'USD' });
    expect(status.active).toBe(true);
    expect(status.event?.id).toBe('fomc-1');
    expect(status.remainingSec).toBe(20 * 60);

    // Upcoming high-impact within 30 minutes
    expect(cal.upcoming(fomcTime - 1800, 1800, 'high').map((e) => e.id)).toEqual(['fomc-1']);

    // Chart marker mapping filters out low impact by default
    const markers = cal.toChartMarkers(fomcTime - 3600, fomcTime + 7200, 'medium');
    expect(markers).toHaveLength(1);
    expect(markers[0]!.summary).toContain('Forecast: 4.25%');
  });
});
