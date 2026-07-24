import { describe, expect, it } from 'vitest';
import {
  mhdClaimDecisionSchema,
  mhdCompanyRatePolicySchema,
  mhdRateProposalSchema,
  mhdTripFormSchema,
} from '../Schemas';

const validTrip = {
  personId: 'person-1',
  tripDate: '2020-01-15',
  miles: 42,
  origin: 'Office',
  destination: 'Client site',
  businessPurpose: 'Quarterly review',
  notOrdinaryCommuting: true,
  isRoundTrip: false,
  odometerStart: null,
  odometerEnd: null,
  commuteDeductionMiles: null,
  vehicleDescription: null,
  notes: null,
};

describe('mhdTripFormSchema', () => {
  it('accepts a substantiated, affirmed, past-dated trip', () => {
    expect(mhdTripFormSchema.safeParse(validTrip).success).toBe(true);
  });

  it('refuses a trip without the not-ordinary-commuting affirmation', () => {
    const result = mhdTripFormSchema.safeParse({ ...validTrip, notOrdinaryCommuting: false });
    expect(result.success).toBe(false);
  });

  it('refuses a blank business purpose — it is the substantiation', () => {
    const result = mhdTripFormSchema.safeParse({ ...validTrip, businessPurpose: '   ' });
    expect(result.success).toBe(false);
  });

  it('refuses a trip dated in the future', () => {
    const result = mhdTripFormSchema.safeParse({ ...validTrip, tripDate: '2999-01-01' });
    expect(result.success).toBe(false);
  });

  it('refuses a commute deduction that is not smaller than the trip', () => {
    const result = mhdTripFormSchema.safeParse({ ...validTrip, commuteDeductionMiles: 42 });
    expect(result.success).toBe(false);
  });
});

describe('mhdRateProposalSchema', () => {
  const validRate = {
    category: 'BUSINESS' as const,
    ratePerMile: 0.7,
    effectiveFrom: '2026-07-01',
    sourceUrl: 'https://www.irs.gov/newsroom/irs-mileage',
    noticeNumber: 'IR-2026-XX',
    sourceDocumentDate: null,
    notes: null,
  };

  it('accepts a fully cited proposal', () => {
    expect(mhdRateProposalSchema.safeParse(validRate).success).toBe(true);
  });

  it('refuses a proposal whose source URL is not a URL', () => {
    expect(mhdRateProposalSchema.safeParse({ ...validRate, sourceUrl: 'not-a-url' }).success).toBe(
      false,
    );
  });

  it('refuses a proposal with no notice number', () => {
    expect(mhdRateProposalSchema.safeParse({ ...validRate, noticeNumber: '' }).success).toBe(false);
  });
});

describe('mhdCompanyRatePolicySchema — mode and rate paired in both directions', () => {
  const base = { companyId: 'company-1', effectiveFrom: '2026-01-01', policyNote: null };

  it('accepts a FIXED policy carrying its rate', () => {
    const result = mhdCompanyRatePolicySchema.safeParse({
      ...base,
      rateMode: 'FIXED',
      fixedRatePerMile: 0.75,
    });
    expect(result.success).toBe(true);
  });

  it('refuses a FIXED policy without a rate', () => {
    const result = mhdCompanyRatePolicySchema.safeParse({
      ...base,
      rateMode: 'FIXED',
      fixedRatePerMile: null,
    });
    expect(result.success).toBe(false);
  });

  it('refuses a tracking policy that still carries a fixed rate', () => {
    const result = mhdCompanyRatePolicySchema.safeParse({
      ...base,
      rateMode: 'TRACK_IRS_BUSINESS',
      fixedRatePerMile: 0.75,
    });
    expect(result.success).toBe(false);
  });
});

describe('mhdClaimDecisionSchema', () => {
  it('requires a note on a rejection', () => {
    const result = mhdClaimDecisionSchema.safeParse({
      claimId: 'claim-1',
      decision: 'REJECTED',
      decisionNote: null,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a rejection with a note', () => {
    const result = mhdClaimDecisionSchema.safeParse({
      claimId: 'claim-1',
      decision: 'REJECTED',
      decisionNote: 'Trips fall outside the stated period.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an approval with no note', () => {
    const result = mhdClaimDecisionSchema.safeParse({
      claimId: 'claim-1',
      decision: 'APPROVED',
      decisionNote: null,
    });
    expect(result.success).toBe(true);
  });
});
