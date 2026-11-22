import { describe, it, expect } from 'vitest';
import { Chart } from '../src/core/chart';
import { fakeDocument } from './helpers/fake-dom';
import {
  DEFAULT_TIMEZONE,
  formatUtcCrosshairLabel,
  formatUtcDate,
  formatUtcTime,
  formatUtcTimeSeconds,
  formatZonedCrosshairLabel,
  formatZonedDate,
  formatZonedTime,
  formatZonedTimeSeconds,
  isNewUtcDay,
  isNewZonedDay,
  isValidTimezone,
  utcSecondsToUtcDateString,
  utcSecondsToUtcParts,
  utcSecondsToZonedDateString,
  utcSecondsToZonedParts,
  utcStringToUtcSeconds,
  zonedStringToUtcSeconds,
  zoneOffsetSeconds,
} from '../src/feed/time';

const PK = 'Asia/Karachi';
const NY = 'America/New_York';
const LONDON = 'Europe/London';

const utc = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0): number =>
  Math.floor(Date.UTC(y, mo - 1, d, h, mi, s) / 1000);

describe('UTC default and supported market zones (Pakistan, New York, London)', () => {
  it('defaults to UTC everywhere', () => {
    expect(DEFAULT_TIMEZONE).toBe('UTC');
    const doc = fakeDocument();
    const chart = new Chart(doc.createElement('div'), { document: doc, shortcuts: false, raf: { schedule: () => 0 } });
    expect(chart.timezone()).toBe('UTC');
    chart.destroy();
  });

  it('matches Intl UTC against zero-offset UTC helpers', () => {
    const samples = [utc(2024, 1, 1, 0, 0, 0), utc(2024, 2, 29, 23, 59, 59), utc(2026, 5, 21, 14, 30, 5)];
    for (const t of samples) {
      expect(utcSecondsToZonedParts(t, 'UTC')).toEqual(utcSecondsToUtcParts(t));
      expect(formatZonedTime(t, 'UTC')).toBe(formatUtcTime(t));
      expect(formatZonedTimeSeconds(t, 'UTC')).toBe(formatUtcTimeSeconds(t));
      expect(formatZonedDate(t, 'UTC')).toBe(formatUtcDate(t));
      expect(utcSecondsToZonedDateString(t, 'UTC')).toBe(utcSecondsToUtcDateString(t));
      expect(formatZonedCrosshairLabel(t, 'UTC')).toBe(formatUtcCrosshairLabel(t));
      expect(zoneOffsetSeconds(t, 'UTC')).toBe(0);
    }
    expect(isNewZonedDay(utc(2024, 5, 20, 23, 59, 59), utc(2024, 5, 21, 0, 0, 0), 'UTC'))
      .toBe(isNewUtcDay(utc(2024, 5, 20, 23, 59, 59), utc(2024, 5, 21, 0, 0, 0)));
    expect(zonedStringToUtcSeconds('2024-02-29 09:30')).toBe(utcStringToUtcSeconds('2024-02-29 09:30'));
  });

  it('supports Pakistan (Asia/Karachi), London (Europe/London), and New York (America/New_York)', () => {
    for (const z of ['UTC', PK, LONDON, NY]) expect(isValidTimezone(z)).toBe(true);
    const t = utc(2024, 7, 15, 4, 30, 0); // 09:30 PKT (UTC+5), 05:30 BST (UTC+1), 00:30 EDT (UTC-4)
    expect(formatZonedTime(t, PK)).toBe('09:30');
    expect(formatZonedTime(t, LONDON)).toBe('05:30');
    expect(formatZonedTime(t, NY)).toBe('00:30');
    expect(zoneOffsetSeconds(t, PK)).toBe(5 * 3600);
  });
});
