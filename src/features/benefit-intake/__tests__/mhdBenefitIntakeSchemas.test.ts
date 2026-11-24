import { describe, expect, it } from 'vitest';
import { mhdLeavePayrollHoursSchema } from '@/features/leaves/Schemas';
import {
  mhdInformationRequestSchema,
  mhdInformationResponseSchema,
  mhdBenefitIntakePayloadSchema,
} from '../Schemas';
import { mhdBenefitIntakeBucket } from '../Types';

const base = { needsTimeAway: true, needsWorkplaceChange: false };
const CASE_ID = '4b6e0b5e-7f2a-4c1d-9a35-2e8d1f0c7a64';

describe('mhdBenefitIntakePayloadSchema', () => {
  it.each(['FAMILY_HEALTH', 'MILITARY_EXIGENCY', 'MILITARY_CAREGIVER'] as const)(
    'rejects %s without a family relationship',
    (reason) => {
      const result = mhdBenefitIntakePayloadSchema.safeParse({ ...base, reason });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(['familyRelationship']);
    },
  );

  it('accepts PREGNANCY without a relationship', () => {
    expect(mhdBenefitIntakePayloadSchema.safeParse({ ...base, reason: 'PREGNANCY' }).success).toBe(
      true,
    );
  });

  it('accepts a family reason once a relationship is given', () => {
    expect(
      mhdBenefitIntakePayloadSchema.safeParse({
        ...base,
        reason: 'FAMILY_HEALTH',
        familyRelationship: 'PARENT',
      }).success,
    ).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    const result = mhdBenefitIntakePayloadSchema.safeParse({
      ...base,
      reason: 'OWN_HEALTH',
      requestedStart: '2026-12-10',
      requestedEnd: '2026-12-01',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['requestedEnd']);
  });

  it('rejects diagnosis-like text in the accommodation summary', () => {
    const result = mhdBenefitIntakePayloadSchema.safeParse({
      ...base,
      reason: 'OWN_HEALTH',
      accommodation: { requestSummary: 'Caused by a prior diagnosis.' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts a plain functional description in the accommodation summary', () => {
    expect(
      mhdBenefitIntakePayloadSchema.safeParse({
        ...base,
        reason: 'OWN_HEALTH',
        accommodation: { requestSummary: 'A sit-stand desk to alternate positions.' },
      }).success,
    ).toBe(true);
  });
});

describe('mhdLeavePayrollHoursSchema', () => {
  const valid = {
    caseId: CASE_ID,
    hoursWorked12Months: 1412,
    periodStart: '2025-11-01',
    periodEnd: '2026-10-31',
    attachmentId: '8d2f7c19-3a64-4e0b-b5d8-1c9e6a7f3b02',
  };

  it('accepts a complete payroll record', () => {
    expect(mhdLeavePayrollHoursSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects 8761 hours', () => {
    expect(
      mhdLeavePayrollHoursSchema.safeParse({ ...valid, hoursWorked12Months: 8761 }).success,
    ).toBe(false);
  });
  it('rejects a period end that is not after the start', () => {
    expect(
      mhdLeavePayrollHoursSchema.safeParse({ ...valid, periodEnd: valid.periodStart }).success,
    ).toBe(false);
  });
  it('rejects a missing attachment id', () => {
    const { attachmentId: _omitted, ...rest } = valid;
    expect(mhdLeavePayrollHoursSchema.safeParse(rest).success).toBe(false);
  });
});

describe('information request schemas', () => {
  it('rejects a due date in the past', () => {
    expect(
      mhdInformationRequestSchema.safeParse({
        caseType: 'LEAVE',
        caseId: CASE_ID,
        question: 'Please confirm your expected return date.',
        dueDate: '2020-01-02',
      }).success,
    ).toBe(false);
  });
  it('rejects prohibited medical detail in a question and in a response', () => {
    expect(
      mhdInformationRequestSchema.safeParse({
        caseType: 'ACCOMMODATION',
        caseId: CASE_ID,
        question: 'What is the diagnosis?',
        dueDate: '2999-01-02',
      }).success,
    ).toBe(false);
    expect(
      mhdInformationResponseSchema.safeParse({
        activityId: CASE_ID,
        response: 'My diagnosis is recorded.',
      }).success,
    ).toBe(false);
  });
});

describe('mhdBenefitIntakeBucket', () => {
  it('puts a requested leave in progress and an approved one in submitted/current', () => {
    expect(mhdBenefitIntakeBucket('LEAVE', 'REQUESTED')).toBe('IN_PROGRESS');
    expect(mhdBenefitIntakeBucket('LEAVE', 'APPROVED')).toBe('SUBMITTED_CURRENT');
  });
  it('puts open accommodation stages in progress and closed ones in submitted/current', () => {
    for (const status of [
      'INTAKE',
      'INTERACTIVE_PROCESS',
      'DOCUMENTATION_PENDING',
      'EVALUATION',
      'DECIDED',
    ] as const) {
      expect(mhdBenefitIntakeBucket('ACCOMMODATION', status)).toBe('IN_PROGRESS');
    }
    expect(mhdBenefitIntakeBucket('ACCOMMODATION', 'IMPLEMENTING')).toBe('SUBMITTED_CURRENT');
  });
});
