import { describe, expect, it } from 'vitest';
import { mhdCreateHandbookSchema } from '../Schemas';

describe('mhdCreateHandbookSchema (zod v4)', () => {
  it('accepts a valid EMPLOYEE handbook with at least one jurisdiction', () => {
    const result = mhdCreateHandbookSchema.safeParse({
      companyId: 'company-1',
      handbookType: 'EMPLOYEE',
      title: '2026 Employee Handbook',
      jurisdictions: ['FEDERAL', 'CA'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty jurisdiction set — mirrors the RPC "at least one jurisdiction" raise', () => {
    const result = mhdCreateHandbookSchema.safeParse({
      companyId: 'company-1',
      handbookType: 'SAFETY',
      title: 'Safety Handbook',
      jurisdictions: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'Choose at least one jurisdiction.')).toBe(
        true,
      );
    }
  });

  it('rejects a blank title', () => {
    const result = mhdCreateHandbookSchema.safeParse({
      companyId: 'company-1',
      handbookType: 'EMPLOYEE',
      title: '   ',
      jurisdictions: ['FEDERAL'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown handbook type', () => {
    const result = mhdCreateHandbookSchema.safeParse({
      companyId: 'company-1',
      handbookType: 'BENEFITS',
      title: 'Handbook',
      jurisdictions: ['FEDERAL'],
    });
    expect(result.success).toBe(false);
  });
});
