import { describe, it, expect } from 'vitest';
import { utcSecondsToUtcDateString } from '../src/feed/time';
import { DataLayer } from '../src/model/data-layer';
import { getChartType, registerChartType } from '../src/model/chart-type-registry';
import type { Bar } from '../src/model/bar';

const bar = (time: number, c: number): Bar => ({ time, open: c, high: c + 1, low: c - 1, close: c });

describe('C1: history date formatting', () => {
  it('formats UTC seconds as a UTC YYYY-MM-DD date', () => {
    expect(utcSecondsToUtcDateString(Date.UTC(2024, 0, 15, 3, 45) / 1000)).toBe('2024-01-15');
    expect(utcSecondsToUtcDateString(Date.UTC(2024, 0, 14, 20, 0) / 1000)).toBe('2024-01-14');
  });
});

describe('H5/H6: registry custom keys + clear tier error', () => {
  it('accepts a custom string chart type', () => {
    registerChartType('my-custom-style', { defaultStyle: {}, isPriceSeries: true, draw: () => {}, extents: (b) => ({ min: b.low, max: b.high }) });
    expect(() => getChartType('my-custom-style')).not.toThrow();
  });
  it('gives a tier-specific error for transform-only types when not loaded', () => {
    expect(() => getChartType('point-figure')).toThrow(/transform tier/);
  });
});

describe('H7: DataLayer.update reports change kind', () => {
  it('distinguishes append / replace / insert', () => {
    const dl = new DataLayer();
    const id = dl.createSeries();
    dl.setSeriesData(id, [bar(100, 1), bar(200, 2)]);
    expect(dl.update(id, bar(300, 3))).toBe('append');
    expect(dl.update(id, bar(300, 3.5))).toBe('replace');
    expect(dl.update(id, bar(150, 1.5))).toBe('insert');
  });
});
