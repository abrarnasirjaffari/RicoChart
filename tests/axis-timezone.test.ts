import { describe, it, expect } from 'vitest';
import { DataLayer } from '../src/model/data-layer';
import { TimeScale } from '../src/scale/time-scale';
import { drawTimeAxis, type PlotLayout, type TickMarkType } from '../src/render/axis';
import { RecordingContext } from './helpers/fake-ctx';
import { formatUtcDate, formatUtcTime, utcSecondsToUtcParts } from '../src/feed/time';
import type { Bar } from '../src/model/bar';

const PK = 'Asia/Karachi';
const NY = 'America/New_York';
const LONDON = 'Europe/London';

const utc = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0): number =>
  Math.floor(Date.UTC(y, mo - 1, d, h, mi, s) / 1000);

function bars(from: number, count: number, stepSec = 3600): Bar[] {
  return Array.from({ length: count }, (_, i) => ({
    time: from + i * stepSec, open: 100, high: 101, low: 99, close: 100,
  }));
}

const LAYOUT: PlotLayout = {
  plotWidth: 600, plotHeight: 378, priceAxisWidth: 56, timeAxisHeight: 22, plotLeft: 0,
};

function drawFrame(
  data: Bar[],
  timezone?: string,
  timeFormatter?: (utcSeconds: number, tickMark?: TickMarkType) => string,
): RecordingContext {
  const dl = new DataLayer();
  dl.setSeriesData(dl.createSeries(), data);
  const ts = new TimeScale({ barSpacing: 100 });
  ts.setWidth(LAYOUT.plotWidth);
  ts.setRightOffset(0);
  ts.setBaseIndex(dl.baseIndex);
  const rec = new RecordingContext();
  drawTimeAxis(rec as unknown as CanvasRenderingContext2D, ts, dl, LAYOUT, 1, undefined, timeFormatter, timezone);
  return rec;
}

function labels(data: Bar[], timezone?: string): string[] {
  return drawFrame(data, timezone).ops
    .filter((o) => o.type === 'fillText')
    .map((o) => o.text ?? '');
}

const OVER_UTC_MIDNIGHT = bars(utc(2024, 3, 6, 21), 6);

describe('time axis in UTC default and market zones', () => {
  it('labels in UTC when no zone is given', () => {
    expect(labels(OVER_UTC_MIDNIGHT)).toEqual(['06 Mar', '22:00', '23:00', '07 Mar', '01:00', '02:00']);
  });

  it('matches UTC parts helper bar by bar', () => {
    const expected = OVER_UTC_MIDNIGHT.map((b, i) => {
      const prev = i === 0 ? undefined : utcSecondsToUtcParts(OVER_UTC_MIDNIGHT[i - 1].time);
      const now = utcSecondsToUtcParts(b.time);
      const newDay = prev === undefined || prev.year !== now.year || prev.month !== now.month || prev.day !== now.day;
      return newDay ? formatUtcDate(b.time) : formatUtcTime(b.time);
    });
    expect(labels(OVER_UTC_MIDNIGHT)).toEqual(expected);
  });

  it('turns the day over at local midnight in Karachi, London, and New York', () => {
    expect(labels(OVER_UTC_MIDNIGHT, PK)).toEqual(['07 Mar', '03:00', '04:00', '05:00', '06:00', '07:00']);
    expect(labels(OVER_UTC_MIDNIGHT, LONDON)).toEqual(['06 Mar', '22:00', '23:00', '07 Mar', '01:00', '02:00']);
    expect(labels(OVER_UTC_MIDNIGHT, NY)).toEqual(['06 Mar', '17:00', '18:00', '19:00', '20:00', '21:00']);
  });
});
