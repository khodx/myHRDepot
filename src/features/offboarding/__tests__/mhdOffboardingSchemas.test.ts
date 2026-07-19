import { describe, expect, it } from 'vitest';
import {
  mhdCaseCancelSchema,
  mhdCaseFormSchema,
  mhdCustomItemSchema,
  mhdExitInterviewQuickCreateSchema,
  mhdItemWaiverSchema,
  mhdOffboardingCaseFilterSchema,
} from '../Schemas';

const offboardingCase = {
  companyId: 'company-1',
  personId: 'person-1',
  separationType: 'RESIGNATION',
  separationDate: '2026-08-01',
};

describe('offboarding schemas', () => {
  it('accepts a valid case and rejects a last working day before the separation date', () => {
    expect(mhdCaseFormSchema.parse(offboardingCase).separationType).toBe('RESIGNATION');
    expect(
      mhdCaseFormSchema.parse({
        ...offboardingCase,
        lastWorkingDay: '2026-08-15',
      }).lastWorkingDay,
    ).toBe('2026-08-15');
    expect(() =>
      mhdCaseFormSchema.parse({
        ...offboardingCase,
        lastWorkingDay: '2026-07-15',
      }),
    ).toThrow('Last working day must be on or after the separation date.');
  });

  it('requires a non-blank cancellation reason', () => {
    expect(() => mhdCaseCancelSchema.parse({})).toThrow();
    expect(() =>
      mhdCaseCancelSchema.parse({
        cancelReason: '   ',
      }),
    ).toThrow('A cancellation reason is required to cancel an offboarding case.');
    expect(
      mhdCaseCancelSchema.parse({
        cancelReason: 'Separation rescinded.',
      }).cancelReason,
    ).toBe('Separation rescinded.');
  });

  it('requires a reason for WAIVED and NOT_APPLICABLE item statuses only', () => {
    expect(() =>
      mhdItemWaiverSchema.parse({
        status: 'WAIVED',
      }),
    ).toThrow('A reason is required to waive an item or mark it not applicable.');
    expect(() =>
      mhdItemWaiverSchema.parse({
        status: 'NOT_APPLICABLE',
        reason: '',
      }),
    ).toThrow('A reason is required to waive an item or mark it not applicable.');
    expect(
      mhdItemWaiverSchema.parse({
        status: 'WAIVED',
        reason: 'Fully remote contractor; nothing issued.',
      }).status,
    ).toBe('WAIVED');
  });

  it('validates custom items and the title-plus-date exit interview quick-create contract', () => {
    expect(mhdCustomItemSchema.parse({ caseId: 'case-1', title: 'Return badge' }).title).toBe(
      'Return badge',
    );
    expect(() => mhdCustomItemSchema.parse({ caseId: 'case-1', title: '   ' })).toThrow(
      'Title cannot be blank.',
    );
    expect(
      mhdExitInterviewQuickCreateSchema.parse({
        title: 'Exit interview',
        activityDate: '2026-08-15',
      }).activityDate,
    ).toBe('2026-08-15');
    expect(() =>
      mhdExitInterviewQuickCreateSchema.parse({ title: 'Exit interview', activityDate: '' }),
    ).toThrow('Date is required.');
  });

  it('defaults every optional filter to its ALL / empty sentinel', () => {
    const filters = mhdOffboardingCaseFilterSchema.parse({ companyId: 'company-1' });
    expect(filters).toEqual({
      companyId: 'company-1',
      personId: 'ALL',
      separationType: 'ALL',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    });
  });
});
