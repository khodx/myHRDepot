import { describe, expect, it } from 'vitest';
import { mhdEligibilityBlockerMessage } from '../EligibilityBlockers';

describe('mhdEligibilityBlockerMessage', () => {
  it('words each known blocker without showing its code', () => {
    expect(mhdEligibilityBlockerMessage('SCHEDULE_ASSIGNMENT_REQUIRED')).toMatch(
      /no work schedule/i,
    );
    expect(mhdEligibilityBlockerMessage('REASON_CODE_REQUIRED')).toMatch(
      /leave reason is missing/i,
    );
  });

  it('falls back to a plain sentence for an unknown code, never the code itself', () => {
    const message = mhdEligibilityBlockerMessage('SOMETHING_NEW_REQUIRED');
    expect(message).not.toContain('SOMETHING_NEW_REQUIRED');
    expect(message).toMatch(/could not be completed/i);
  });
});
