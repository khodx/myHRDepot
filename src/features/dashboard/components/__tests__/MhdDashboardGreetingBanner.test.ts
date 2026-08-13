import { describe, expect, it } from 'vitest';
import {
  mhdComputeTenureParts,
  mhdFormatDigitalClock,
  mhdFormatGreetingDate,
  mhdFormatTenure,
  mhdTimeOfDayGreeting,
} from '../MhdDashboardGreetingBanner';

describe('mhdTimeOfDayGreeting', () => {
  it('greets morning before noon', () => {
    expect(mhdTimeOfDayGreeting(0)).toBe('Good Morning');
    expect(mhdTimeOfDayGreeting(11)).toBe('Good Morning');
  });

  it('greets afternoon from noon to before 6pm', () => {
    expect(mhdTimeOfDayGreeting(12)).toBe('Good Afternoon');
    expect(mhdTimeOfDayGreeting(17)).toBe('Good Afternoon');
  });

  it('greets evening from 6pm onward', () => {
    expect(mhdTimeOfDayGreeting(18)).toBe('Good Evening');
    expect(mhdTimeOfDayGreeting(23)).toBe('Good Evening');
  });
});

describe('mhdFormatGreetingDate', () => {
  it('formats as weekday, month day, year', () => {
    // Thursday, August 13, 2026 (local, no timezone conversion needed for a noon time)
    expect(mhdFormatGreetingDate(new Date(2026, 7, 13, 12))).toBe('Thursday, August 13, 2026');
  });
});

describe('mhdFormatDigitalClock', () => {
  it('formats as h:mm:ss with AM/PM', () => {
    expect(mhdFormatDigitalClock(new Date(2026, 0, 1, 15, 5, 9))).toBe('3:05:09 PM');
    expect(mhdFormatDigitalClock(new Date(2026, 0, 1, 0, 0, 0))).toBe('12:00:00 AM');
  });
});

describe('mhdComputeTenureParts', () => {
  it('returns zeros when now is not after start', () => {
    const date = new Date(2026, 0, 1);
    expect(mhdComputeTenureParts(date, date)).toEqual({ years: 0, months: 0, weeks: 0, days: 0 });
  });

  it('computes an exact multi-year, multi-month, multi-week, multi-day span', () => {
    // 2024-01-10 -> 2026-08-13: 2 years, 7 months, then 3 days remainder =
    // 0 weeks 3 days (Jan 10 + 2y7m = Aug 10 2026; Aug 10 -> Aug 13 is 3 days).
    const start = new Date(2024, 0, 10);
    const now = new Date(2026, 7, 13);
    expect(mhdComputeTenureParts(start, now)).toEqual({ years: 2, months: 7, weeks: 0, days: 3 });
  });

  it('splits a multi-week remainder into weeks and days', () => {
    // 2026-01-01 -> 2026-03-25: 2 months, 24 days remainder = 3 weeks 3 days.
    const start = new Date(2026, 0, 1);
    const now = new Date(2026, 2, 25);
    expect(mhdComputeTenureParts(start, now)).toEqual({ years: 0, months: 2, weeks: 3, days: 3 });
  });

  it('handles a day-31 start date crossing a shorter month (Feb has no 31st)', () => {
    // 2026-01-31 -> 2026-03-01: "+1 month" from Jan 31 rolls to Mar 3 (Feb
    // only has 28 days), which overshoots Mar 1 — so this isn't a full
    // month yet, just 29 elapsed days (4 weeks, 1 day).
    const start = new Date(2026, 0, 31);
    const now = new Date(2026, 2, 1);
    expect(mhdComputeTenureParts(start, now)).toEqual({ years: 0, months: 0, weeks: 4, days: 1 });
  });
});

describe('mhdFormatTenure', () => {
  it('joins all four units with correct pluralization', () => {
    expect(mhdFormatTenure({ years: 2, months: 1, weeks: 3, days: 1 })).toBe(
      '2 Years, 1 Month, 3 Weeks, 1 Day',
    );
  });

  it('shows zero-value units rather than omitting them', () => {
    expect(mhdFormatTenure({ years: 0, months: 0, weeks: 0, days: 5 })).toBe(
      '0 Years, 0 Months, 0 Weeks, 5 Days',
    );
  });
});
