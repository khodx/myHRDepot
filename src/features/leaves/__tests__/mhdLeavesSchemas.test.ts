import { describe, expect, it } from 'vitest';
import {
  mhdAdjustLeaveSchema,
  mhdDesignateLeaveSchema,
  mhdLeaveCaseFormSchema,
  mhdTransitionLeaveCaseSchema,
} from '../Schemas';

describe('mhdLeaveCaseFormSchema', () => {
  it('accepts a minimal valid case', () => {
    const result = mhdLeaveCaseFormSchema.safeParse({
      companyId: 'company-1',
      personId: 'person-1',
      reasonCategory: 'Serious health condition',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a reversed date range on the end field (mirrors the DB range CHECK)', () => {
    const result = mhdLeaveCaseFormSchema.safeParse({
      companyId: 'company-1',
      personId: 'person-1',
      reasonCategory: 'Bonding',
      requestedStart: '2026-08-10',
      requestedEnd: '2026-08-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('requestedEnd');
    }
  });
});

describe('mhdTransitionLeaveCaseSchema', () => {
  it('requires a reason to DENY (unexplained denial is indefensible)', () => {
    expect(
      mhdTransitionLeaveCaseSchema.safeParse({ caseId: 'c1', newStatus: 'DENIED' }).success,
    ).toBe(false);
    expect(
      mhdTransitionLeaveCaseSchema.safeParse({
        caseId: 'c1',
        newStatus: 'DENIED',
        decisionReason: 'Ineligible — under 12 months of service.',
      }).success,
    ).toBe(true);
  });

  it('does not require a reason for a benign transition', () => {
    expect(
      mhdTransitionLeaveCaseSchema.safeParse({ caseId: 'c1', newStatus: 'APPROVED' }).success,
    ).toBe(true);
  });
});

describe('ledger schemas', () => {
  it('mhdDesignateLeaveSchema requires positive hours', () => {
    expect(
      mhdDesignateLeaveSchema.safeParse({ caseId: 'c1', hours: 0, effectiveDate: '2026-07-20' })
        .success,
    ).toBe(false);
    expect(
      mhdDesignateLeaveSchema.safeParse({ caseId: 'c1', hours: 8, effectiveDate: '2026-07-20' })
        .success,
    ).toBe(true);
  });

  it('mhdAdjustLeaveSchema requires a non-zero delta and a reason', () => {
    expect(
      mhdAdjustLeaveSchema.safeParse({
        personId: 'p1',
        leaveTypeId: 't1',
        hoursDelta: 0,
        reason: 'x',
      }).success,
    ).toBe(false);
    expect(
      mhdAdjustLeaveSchema.safeParse({
        personId: 'p1',
        leaveTypeId: 't1',
        hoursDelta: 8,
        reason: '',
      }).success,
    ).toBe(false);
    expect(
      mhdAdjustLeaveSchema.safeParse({
        personId: 'p1',
        leaveTypeId: 't1',
        hoursDelta: -8,
        reason: 'Correct an over-credit.',
      }).success,
    ).toBe(true);
  });
});
