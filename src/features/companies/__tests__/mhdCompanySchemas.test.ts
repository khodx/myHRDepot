import { describe, expect, it } from 'vitest';
import { mhdCreateCompanySchema, mhdUpdateCompanySchema } from '../Schemas';

describe('mhdCompanySchemas', () => {
  it('accepts a valid company create payload', () => {
    const result = mhdCreateCompanySchema.safeParse({
      companyName: 'Mission Pediatrics',
      industry: 'Healthcare',
      employeeCount: 42,
      headquartersLocation: 'Austin, TX',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a create payload with only the required field', () => {
    const result = mhdCreateCompanySchema.safeParse({ companyName: 'Mission Pediatrics' });
    expect(result.success).toBe(true);
  });

  it('rejects blank company names', () => {
    const result = mhdCreateCompanySchema.safeParse({ companyName: ' ' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid company update payload', () => {
    const result = mhdUpdateCompanySchema.safeParse({
      companyName: 'Heart & Vascular Wellness Center',
      industry: null,
      employeeCount: null,
      headquartersLocation: null,
    });
    expect(result.success).toBe(true);
  });
});
