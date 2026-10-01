import { describe, expect, it } from 'vitest';
import {
  mhdAttendancePolicySchema,
  mhdCompanyHolidaySchema,
  mhdEndAssignmentSchema,
  mhdGenerateShiftsSchema,
  mhdOccurrenceFormSchema,
  mhdOverrideShiftSchema,
  mhdReclassifyOccurrenceSchema,
  mhdResolveReassessmentSchema,
  mhdScheduleTemplateFormSchema,
  mhdUpdateOccurrenceSchema,
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

describe('reclassification schema', () => {
  const base = {
    occurrenceId: 'occ-1',
    classification: 'UNEXCUSED',
    reason: 'Certification not received.',
  };

  it('requires a reason - the audit trail is why the classification moved', () => {
    expect(() => mhdReclassifyOccurrenceSchema.parse({ ...base, reason: '   ' })).toThrow();
    expect(() => mhdReclassifyOccurrenceSchema.parse({ ...base, reason: undefined })).toThrow();
    expect(mhdReclassifyOccurrenceSchema.parse(base).reason).toBe('Certification not received.');
  });

  it('moving to PROTECTED requires a category, and only PROTECTED may carry one', () => {
    expect(() =>
      mhdReclassifyOccurrenceSchema.parse({ ...base, classification: 'PROTECTED' }),
    ).toThrow(/category/i);
    expect(
      mhdReclassifyOccurrenceSchema.parse({
        ...base,
        classification: 'PROTECTED',
        protectedLeaveCategory: 'CFRA',
      }).protectedLeaveCategory,
    ).toBe('CFRA');
    expect(() =>
      mhdReclassifyOccurrenceSchema.parse({ ...base, protectedLeaveCategory: 'FMLA' }),
    ).toThrow();
  });
});

describe('occurrence edit schema', () => {
  it('has no classification field - classification moves only through reclassify', () => {
    const parsed = mhdUpdateOccurrenceSchema.parse({
      occurrenceId: 'occ-1',
      occurrenceType: 'TARDY',
      classification: 'PROTECTED',
    });
    expect(parsed).not.toHaveProperty('classification');
  });

  it('bounds minutes of variance to a single day', () => {
    expect(() =>
      mhdUpdateOccurrenceSchema.parse({ occurrenceId: 'occ-1', minutesVariance: 1441 }),
    ).toThrow();
    expect(() =>
      mhdUpdateOccurrenceSchema.parse({ occurrenceId: 'occ-1', minutesVariance: -1 }),
    ).toThrow();
  });
});

describe('schedule pattern schema', () => {
  const workingDay = (dayOfWeek: number) => ({
    dayOfWeek,
    isWorkingDay: true,
    startTime: '09:00',
    endTime: '17:30',
    unpaidBreakMinutes: 30,
  });
  const restDay = (dayOfWeek: number) => ({
    dayOfWeek,
    isWorkingDay: false,
    startTime: null,
    endTime: null,
    unpaidBreakMinutes: 0,
  });
  const week = [
    restDay(0),
    workingDay(1),
    workingDay(2),
    workingDay(3),
    workingDay(4),
    workingDay(5),
    restDay(6),
  ];
  const base = { companyId: 'company-1', templateName: 'Front desk', description: '', days: week };

  it('accepts a standard Monday-to-Friday week', () => {
    expect(mhdScheduleTemplateFormSchema.parse(base).days).toHaveLength(7);
  });

  it('refuses a pattern with no working days - it would never produce a shift', () => {
    const allRest = [0, 1, 2, 3, 4, 5, 6].map(restDay);
    expect(() => mhdScheduleTemplateFormSchema.parse({ ...base, days: allRest })).toThrow(
      /no working days/i,
    );
  });

  it('refuses a working day without times, or with an end before its start', () => {
    const noTimes = week.map((day) =>
      day.dayOfWeek === 1 ? { ...day, startTime: null, endTime: null } : day,
    );
    expect(() => mhdScheduleTemplateFormSchema.parse({ ...base, days: noTimes })).toThrow();
    const inverted = week.map((day) =>
      day.dayOfWeek === 1 ? { ...day, startTime: '18:00', endTime: '09:00' } : day,
    );
    expect(() => mhdScheduleTemplateFormSchema.parse({ ...base, days: inverted })).toThrow(
      /after start/i,
    );
  });

  it('refuses a non-working day that still carries times (mirrors the database CHECK)', () => {
    const stray = week.map((day) =>
      day.dayOfWeek === 0 ? { ...day, startTime: '09:00', endTime: '10:00' } : day,
    );
    expect(() => mhdScheduleTemplateFormSchema.parse({ ...base, days: stray })).toThrow();
  });

  it('needs exactly seven distinct days', () => {
    expect(() =>
      mhdScheduleTemplateFormSchema.parse({ ...base, days: week.slice(0, 6) }),
    ).toThrow();
    const duplicated = [...week.slice(0, 6), workingDay(1)];
    expect(() => mhdScheduleTemplateFormSchema.parse({ ...base, days: duplicated })).toThrow();
  });
});

describe('shift override, assignment end, holiday and generation schemas', () => {
  it('requires a reason to override a shift, and an end after the start', () => {
    const shift = {
      shiftId: 's1',
      startTime: '08:00',
      endTime: '16:00',
      reason: 'Covering a colleague.',
    };
    expect(mhdOverrideShiftSchema.parse(shift).reason).toBe('Covering a colleague.');
    expect(() => mhdOverrideShiftSchema.parse({ ...shift, reason: ' ' })).toThrow();
    expect(() => mhdOverrideShiftSchema.parse({ ...shift, endTime: '07:00' })).toThrow();
  });

  it('requires a real ISO date to end an assignment', () => {
    expect(
      mhdEndAssignmentSchema.parse({ assignmentId: 'a1', effectiveTo: '2026-10-31' }),
    ).toBeTruthy();
    expect(() =>
      mhdEndAssignmentSchema.parse({ assignmentId: 'a1', effectiveTo: '10/31/2026' }),
    ).toThrow();
  });

  it('requires a holiday name and date', () => {
    expect(() =>
      mhdCompanyHolidaySchema.parse({
        companyId: 'c1',
        holidayDate: '2026-12-25',
        holidayName: '  ',
      }),
    ).toThrow();
    expect(
      mhdCompanyHolidaySchema.parse({
        companyId: 'c1',
        holidayDate: '2026-12-25',
        holidayName: 'Christmas Day',
      }).isPaid,
    ).toBe(true);
  });

  it('refuses a generation range longer than two years, mirroring the RPC guard', () => {
    expect(() =>
      mhdGenerateShiftsSchema.parse({ personId: 'p1', from: '2026-01-01', to: '2028-06-01' }),
    ).toThrow(/two years/i);
    expect(
      mhdGenerateShiftsSchema.parse({ personId: 'p1', from: '2026-01-01', to: '2026-12-31' }),
    ).toBeTruthy();
  });
});
