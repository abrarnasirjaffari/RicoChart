import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIMEZONE,
  epochMsToUtcSeconds,
  utcStringToUtcSeconds,
  utcSecondsToUtcParts,
  formatUtcTime,
  formatUtcTimeSeconds,
  formatUtcDate,
  formatUtcCrosshairLabel,
  isNewUtcDay,
} from '../src/feed/time';

describe('time conversions (UTC default)', () => {
  it('defaults to UTC', () => {
    expect(DEFAULT_TIMEZONE).toBe('UTC');
  });

  it('epoch ms to utc seconds floors to the second', () => {
    expect(epochMsToUtcSeconds(1_700_000_000_999)).toBe(1_700_000_000);
  });

  it('UTC string and the equivalent epoch produce the same UTC seconds', () => {
    const fromUtc = utcStringToUtcSeconds('2024-01-15 09:15:00');
    const utcMs = Date.UTC(2024, 0, 15, 9, 15, 0);
    expect(fromUtc).toBe(Math.floor(utcMs / 1000));
  });

  it('round-trips UTC wall-clock through parts', () => {
    const sec = utcStringToUtcSeconds('2024-03-15 14:30:45');
    const p = utcSecondsToUtcParts(sec);
    expect(p).toMatchObject({ year: 2024, month: 3, day: 15, hour: 14, minute: 30, second: 45 });
  });

  it('accepts date-only and T-separated forms', () => {
    expect(utcStringToUtcSeconds('2024-01-15')).toBe(utcStringToUtcSeconds('2024-01-15 00:00:00'));
    expect(utcStringToUtcSeconds('2024-01-15T09:15')).toBe(utcStringToUtcSeconds('2024-01-15 09:15:00'));
  });

  it('formats UTC labels', () => {
    const sec = utcStringToUtcSeconds('2024-01-15 09:05:00');
    expect(formatUtcTime(sec)).toBe('09:05');
    expect(formatUtcDate(sec)).toBe('15 Jan');
  });

  it('formats sub-minute (seconds / tick) clock labels', () => {
    const sec = utcStringToUtcSeconds('2024-01-15 09:15:35');
    expect(formatUtcTimeSeconds(sec)).toBe('09:15:35');
    expect(formatUtcTime(sec)).toBe('09:15');
  });

  it('crosshair label shows :SS only on sub-minute bars', () => {
    const onMinute = utcStringToUtcSeconds('2026-05-21 14:30:00');
    const subMinute = utcStringToUtcSeconds('2026-05-21 14:30:05');
    expect(formatUtcCrosshairLabel(onMinute)).toBe("Thu 21 May '26 14:30");
    expect(formatUtcCrosshairLabel(subMinute)).toBe("Thu 21 May '26 14:30:05");
  });

  it('detects UTC day boundaries', () => {
    const a = utcStringToUtcSeconds('2024-01-15 15:30:00');
    const b = utcStringToUtcSeconds('2024-01-16 09:15:00');
    const c = utcStringToUtcSeconds('2024-01-15 09:15:00');
    expect(isNewUtcDay(a, b)).toBe(true);
    expect(isNewUtcDay(c, a)).toBe(false);
  });
});
