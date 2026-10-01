import { describe, expect, it } from 'vitest';
import { mhdFeedbackSettingsSchema } from '../Schemas-v2';

describe('feedback release threshold', () => {
  it('asks for the minimum responses when the field is blank', () => {
    const result = mhdFeedbackSettingsSchema.safeParse({
      companyId: 'company-1',
      minResponsesForRelease: undefined,
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain('Enter the minimum number of responses.');
  });

  it('keeps the anonymity floor for a number that is present', () => {
    const result = mhdFeedbackSettingsSchema.safeParse({
      companyId: 'company-1',
      minResponsesForRelease: 2,
    });
    expect(result.success).toBe(false);
  });
});
