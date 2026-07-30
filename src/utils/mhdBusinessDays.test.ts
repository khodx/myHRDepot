import { describe, expect, it } from 'vitest';
import { addBusinessDays } from '@/utils/mhdBusinessDays';

describe('addBusinessDays', () => {
  it('skips weekends when adding business days', () => {
    // 2026-07-30 is a Thursday. +8 business days lands on 2026-08-11
    // (Tue): Fri 31, Mon 3, Tue 4, Wed 5, Thu 6, Fri 7, Mon 10, Tue 11.
    expect(addBusinessDays('2026-07-30', 8)).toBe('2026-08-11');
  });

  it('skips holiday dates in addition to weekends', () => {
    // Same 8-business-day span as above, but 2026-08-06 (Thu) is a holiday,
    // pushing the result out one extra calendar day to 2026-08-12.
    expect(addBusinessDays('2026-07-30', 8, ['2026-08-06'])).toBe('2026-08-12');
  });

  it('returns the same date for zero days', () => {
    expect(addBusinessDays('2026-07-30', 0)).toBe('2026-07-30');
  });
});
