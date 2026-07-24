import { describe, expect, it } from 'vitest';
import {
  mhdCompetencySchema,
  mhdJobAssignmentSchema,
  mhdJobCompetenciesSchema,
  mhdJobFormSchema,
  mhdPayRangeSchema,
} from '../Schemas';
import { mhdCanPublishDescription, mhdPayChangeAuditMetadata } from '../Types';

describe('job schemas — pay bounds and period', () => {
  it('rejects an upper bound below the lower bound', () => {
    expect(() =>
      mhdPayRangeSchema.parse({
        jobId: 'job-1',
        payMin: 50000,
        payMax: 40000,
        payPeriod: 'ANNUAL',
      }),
    ).toThrow('The upper bound must be at or above the lower bound.');
  });

  it('requires a period once either bound is set on a job form', () => {
    expect(() =>
      mhdJobFormSchema.parse({ companyId: 'company-1', jobTitle: 'Cook', payMin: 40000 }),
    ).toThrow('Choose hourly or annual for the pay range.');
    // No bounds, no period is fine.
    expect(mhdJobFormSchema.parse({ companyId: 'company-1', jobTitle: 'Cook' }).jobTitle).toBe(
      'Cook',
    );
  });

  it('accepts a valid O*NET-SOC code and rejects a malformed one', () => {
    expect(
      mhdJobFormSchema.parse({
        companyId: 'company-1',
        jobTitle: 'Driver',
        onetSocCode: '53-3032.00',
      }).onetSocCode,
    ).toBe('53-3032.00');
    expect(() =>
      mhdJobFormSchema.parse({
        companyId: 'company-1',
        jobTitle: 'Driver',
        onetSocCode: 'not-a-code',
      }),
    ).toThrow('Use an O*NET-SOC code');
  });
});

describe('job schemas — publish gate and duplicates', () => {
  it('refuses publishing without a summary, then without an essential function, then allows both', () => {
    expect(mhdCanPublishDescription('', 1).ok).toBe(false);
    expect(mhdCanPublishDescription('  ', 3).reason).toContain('summary');
    expect(mhdCanPublishDescription('A real summary', 0).ok).toBe(false);
    expect(mhdCanPublishDescription('A real summary', 0).reason).toContain('essential function');
    expect(mhdCanPublishDescription('A real summary', 1).ok).toBe(true);
  });

  it('refuses the same competency twice on one description', () => {
    expect(() =>
      mhdJobCompetenciesSchema.parse({
        descriptionId: 'desc-1',
        competencies: [{ competencyId: 'comp-1' }, { competencyId: 'comp-1' }],
      }),
    ).toThrow('A competency cannot appear twice on one description.');
  });

  it('refuses self-management on an assignment', () => {
    expect(() =>
      mhdJobAssignmentSchema.parse({
        personId: 'person-1',
        jobId: 'job-1',
        effectiveFrom: '2026-07-01',
        managerPersonId: 'person-1',
      }),
    ).toThrow('Somebody cannot manage themselves.');
  });

  it('allows a null companyId on a competency — that is how a GLOBAL row is addressed', () => {
    expect(
      mhdCompetencySchema.parse({ companyId: null, competencyName: 'Leadership' }).companyId,
    ).toBeNull();
  });
});

/**
 * Pay-change audit metadata carries the PERIOD and never the figures.
 * `audit_events` has a wider readership than the pay columns (Client Admin can
 * read the trail but never the band), so writing pay_min / pay_max there would
 * route around the RPC's masking. This pins the one client-side place that shape
 * is produced; the server-side audit row is verified independently in Stage 3.
 */
describe('job schemas — pay-change audit metadata excludes the figures', () => {
  it('records pay_period only, with no pay_min or pay_max present at all', () => {
    const metadata = mhdPayChangeAuditMetadata({ payPeriod: 'ANNUAL' });

    expect(metadata).toEqual({ pay_period: 'ANNUAL' });
    expect(Object.keys(metadata)).toEqual(['pay_period']);
    expect(metadata).not.toHaveProperty('pay_min');
    expect(metadata).not.toHaveProperty('pay_max');
    // Belt and braces: no key anywhere in the payload smells like a figure.
    expect(
      Object.keys(metadata).some((key) => /pay_(min|max)|amount|figure|salary/i.test(key)),
    ).toBe(false);
  });
});
