import { describe, expect, it } from 'vitest';
import { mhdActivityFormSchema, mhdCompleteActivitySchema } from '../Schemas';

/**
 * Duration is optional. A blank duration input used to arrive as NaN (valueAsNumber), which
 * these schemas reject, so an activity could not be completed without entering a duration.
 * Forms now send null for a blank (see utils/mhdFormNumbers); the schemas must accept it.
 */
describe('activity duration', () => {
  it('lets an activity be completed with no duration', () => {
    const result = mhdCompleteActivitySchema.safeParse({
      occurredAt: '2026-10-01T09:00',
      durationMinutes: null,
    });
    expect(result.success).toBe(true);
  });

  it('still rejects a zero or fractional duration', () => {
    const base = { occurredAt: '2026-10-01T09:00' };
    expect(mhdCompleteActivitySchema.safeParse({ ...base, durationMinutes: 0 }).success).toBe(
      false,
    );
    expect(mhdCompleteActivitySchema.safeParse({ ...base, durationMinutes: 1.5 }).success).toBe(
      false,
    );
    expect(mhdCompleteActivitySchema.safeParse({ ...base, durationMinutes: 45 }).success).toBe(
      true,
    );
  });

  it('does not accept NaN, which is what a blank used to become', () => {
    expect(
      mhdCompleteActivitySchema.safeParse({
        occurredAt: '2026-10-01T09:00',
        durationMinutes: Number.NaN,
      }).success,
    ).toBe(false);
    expect(mhdActivityFormSchema).toBeDefined();
  });
});
