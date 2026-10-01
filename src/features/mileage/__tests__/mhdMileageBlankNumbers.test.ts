import { describe, expect, it } from 'vitest';
import { mhdRateProposalSchema, mhdTripFormSchema } from '../Schemas';

/** A blank required number reaches the schema as undefined and must read as a sentence. */
describe('blank required mileage numbers', () => {
  it('asks for the rate per mile', () => {
    const result = mhdRateProposalSchema.safeParse({ ratePerMile: undefined });
    expect(result.success).toBe(false);
    const messages = result.error?.issues
      .filter((i) => i.path[0] === 'ratePerMile')
      .map((i) => i.message);
    expect(messages).toContain('Enter the rate per mile.');
  });

  it('asks for the miles driven', () => {
    const result = mhdTripFormSchema.safeParse({ miles: undefined });
    expect(result.success).toBe(false);
    const messages = result.error?.issues
      .filter((i) => i.path[0] === 'miles')
      .map((i) => i.message);
    expect(messages).toContain('Enter the miles driven.');
  });
});
