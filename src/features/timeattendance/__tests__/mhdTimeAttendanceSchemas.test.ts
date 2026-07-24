import { describe, expect, it } from 'vitest';
import {
  mhdAttendancePolicySchema,
  mhdOccurrenceFormSchema,
  mhdResolveReassessmentSchema,
  mhdVoidOccurrenceSchema,
  type MhdAttendancePolicyFormValues,
} from '../Schemas';

const validPolicy = {
  companyId: 'company-1',
  policyName: 'Standard attendance policy',
  effectiveFrom: '2026-01-01',
  rollOffMonths: 12,
  excusedUnpaidAccrues: false,
  excusedPaidAccrues: false,
  pointRules: [{ occurrenceType: 'ABSENCE', points: 1 }],
  thresholds: [{ pointsAt: 4, actionLevel: 'VERBAL_WARNING' }],
};

describe('attendance policy schema — no protected-accrual field', () => {
  it('parses an accrual config with no protected-accrual key present', () => {
    const parsed = mhdAttendancePolicySchema.parse(validPolicy);
    expect(parsed).not.toHaveProperty('protectedAccrues');
    expect(parsed).not.toHaveProperty('protected_accrues');
    expect(parsed).not.toHaveProperty('protectedLeaveAccrues');
    // The only accrual switches that exist are the two EXCUSED ones. PROTECTED
    // is not configurable — it can never accrue, by CHECK + trigger in 0032.
    expect(Object.keys(parsed)).toEqual(
      expect.arrayContaining(['excusedUnpaidAccrues', 'excusedPaidAccrues']),
    );
  });

  it('strips an injected protected-accrual toggle rather than carrying it into the payload', () => {
    const parsed = mhdAttendancePolicySchema.parse({
      ...validPolicy,
      protectedAccrues: true,
      protected_accrues: true,
    } as unknown as MhdAttendancePolicyFormValues);
    expect(parsed).not.toHaveProperty('protectedAccrues');
    expect(parsed).not.toHaveProperty('protected_accrues');
  });

  it('rejects a policy where nothing can ever accrue', () => {
    expect(() =>
      mhdAttendancePolicySchema.parse({
        ...validPolicy,
        pointRules: [{ occurrenceType: 'ABSENCE', points: 0 }],
      }),
    ).toThrow();
  });
});

describe('occurrence form schema — protected pairing in both directions', () => {
  const base = {
    personId: 'person-1',
    occurrenceDate: '2026-07-01',
    occurrenceType: 'ABSENCE' as const,
  };

  it('requires a category when classification is PROTECTED', () => {
    expect(() => mhdOccurrenceFormSchema.parse({ ...base, classification: 'PROTECTED' })).toThrow();
    expect(
      mhdOccurrenceFormSchema.parse({
        ...base,
        classification: 'PROTECTED',
        protectedLeaveCategory: 'FMLA',
      }).protectedLeaveCategory,
    ).toBe('FMLA');
  });

  it('forbids a category when the classification is not PROTECTED', () => {
    expect(() =>
      mhdOccurrenceFormSchema.parse({
        ...base,
        classification: 'UNEXCUSED',
        protectedLeaveCategory: 'FMLA',
      }),
    ).toThrow();
  });
});

describe('reassessment + void schemas require a reason', () => {
  it('requires a decision note on both ASSESSED and DECLINED', () => {
    expect(() =>
      mhdResolveReassessmentSchema.parse({ eventId: 'e1', decision: 'DECLINED', decisionNote: '' }),
    ).toThrow();
    expect(() =>
      mhdResolveReassessmentSchema.parse({
        eventId: 'e1',
        decision: 'ASSESSED',
        decisionNote: '  ',
      }),
    ).toThrow();
    expect(
      mhdResolveReassessmentSchema.parse({
        eventId: 'e1',
        decision: 'DECLINED',
        decisionNote: 'Documentation confirmed the absence was protected.',
      }).decision,
    ).toBe('DECLINED');
  });

  it('requires a reason to void an occurrence', () => {
    expect(() => mhdVoidOccurrenceSchema.parse({ occurrenceId: 'occ-1', reason: '   ' })).toThrow();
    expect(
      mhdVoidOccurrenceSchema.parse({ occurrenceId: 'occ-1', reason: 'Recorded in error.' }).reason,
    ).toBe('Recorded in error.');
  });
});
