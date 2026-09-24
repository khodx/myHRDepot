import { describe, expect, it } from 'vitest';
import {
  mhdAssignTrainingSchema,
  mhdCreateTrainingExternalAuditorGrantSchema,
  mhdRecordAdminCompletionSchema,
  mhdGenerateTrainingCertificateSchema,
  mhdSetTrainingTimeOnTaskSchema,
  mhdTrainingTimeOnTaskFiltersSchema,
  mhdTrainingCourseFormSchema,
  mhdWaiveAssignmentSchema,
  mhdSendTrainingDeadlineRemindersSchema,
  mhdRetireTrainingCourseSchema,
  mhdSetTrainingContentLicenseSchema,
  mhdBulkAssignTrainingSchema,
} from '../Schemas';

describe('training course form schema', () => {
  it('requires a company, course key and title', () => {
    expect(() =>
      mhdTrainingCourseFormSchema.parse({
        companyId: '',
        courseKey: 'k',
        title: 'T',
        category: 'OTHER',
        deliveryMode: 'DOCUMENT',
      }),
    ).toThrow('Company is required.');

    expect(() =>
      mhdTrainingCourseFormSchema.parse({
        companyId: 'company-1',
        courseKey: '',
        title: 'T',
        category: 'OTHER',
        deliveryMode: 'DOCUMENT',
      }),
    ).toThrow('A course key is required.');
  });

  it('treats a BLANK recurrence as a deliberate one-time course (null), not zero', () => {
    const parsed = mhdTrainingCourseFormSchema.parse({
      companyId: 'company-1',
      courseKey: 'onetime',
      title: 'One-time course',
      category: 'ONBOARDING',
      deliveryMode: 'DOCUMENT',
      durationMinutes: '',
      recurrenceMonths: '',
    });
    expect(parsed.recurrenceMonths).toBeNull();
    expect(parsed.durationMinutes).toBeNull();
  });

  it('coerces a recurrence string to a positive integer, and rejects zero / negative', () => {
    expect(
      mhdTrainingCourseFormSchema.parse({
        companyId: 'company-1',
        courseKey: 'ca-harassment',
        title: 'CA harassment',
        category: 'HARASSMENT',
        deliveryMode: 'ONLINE',
        recurrenceMonths: '24',
      }).recurrenceMonths,
    ).toBe(24);

    expect(() =>
      mhdTrainingCourseFormSchema.parse({
        companyId: 'company-1',
        courseKey: 'k',
        title: 'T',
        category: 'OTHER',
        deliveryMode: 'DOCUMENT',
        recurrenceMonths: '0',
      }),
    ).toThrow('Months must be greater than zero.');
  });

  it('defaults requiresEvidence to false', () => {
    expect(
      mhdTrainingCourseFormSchema.parse({
        companyId: 'company-1',
        courseKey: 'k',
        title: 'T',
        category: 'OTHER',
        deliveryMode: 'DOCUMENT',
      }).requiresEvidence,
    ).toBe(false);
  });
});

describe('training audit engine schemas', () => {
  it('defaults the time-on-task session cap to 480 minutes and validates date filters', () => {
    expect(mhdSetTrainingTimeOnTaskSchema.parse({ companyId: 'company-1' })).toMatchObject({
      companyId: 'company-1',
      maxSessionMinutes: 480,
    });
    expect(
      mhdTrainingTimeOnTaskFiltersSchema.parse({
        companyId: 'company-1',
        from: '2026-09-01',
        to: '2026-09-23',
      }).to,
    ).toBe('2026-09-23');
  });

  it('requires an auditor label and an offset-aware valid-until timestamp', () => {
    expect(() =>
      mhdCreateTrainingExternalAuditorGrantSchema.parse({
        companyId: 'company-1',
        courseId: 'course-1',
        auditorLabel: '',
        validUntil: '2026-10-01T00:00:00Z',
      }),
    ).toThrow('An auditor label is required.');
    expect(() =>
      mhdCreateTrainingExternalAuditorGrantSchema.parse({
        companyId: 'company-1',
        courseId: 'course-1',
        auditorLabel: 'Auditor',
        validUntil: '2026-10-01',
      }),
    ).toThrow();
  });
});

describe('training assignment / waiver / admin-completion schemas', () => {
  it('defaults deadline reminder lead time to seven days', () => {
    expect(mhdSendTrainingDeadlineRemindersSchema.parse({ companyId: 'company-1' })).toEqual({
      companyId: 'company-1',
      daysBefore: 7,
    });
    expect(
      mhdSendTrainingDeadlineRemindersSchema.parse({ companyId: 'company-1', daysBefore: '14' })
        .daysBefore,
    ).toBe(14);
  });

  it('requires a completion id to generate a certificate', () => {
    expect(() => mhdGenerateTrainingCertificateSchema.parse({ completionId: ' ' })).toThrow(
      'Completion is required.',
    );
    expect(mhdGenerateTrainingCertificateSchema.parse({ completionId: 'completion-1' })).toEqual({
      completionId: 'completion-1',
    });
  });

  it('assignment requires a course and a person; due date is optional', () => {
    expect(() =>
      mhdAssignTrainingSchema.parse({ companyId: 'company-1', courseId: '', personId: 'p' }),
    ).toThrow('Choose a course to assign.');
    expect(() =>
      mhdAssignTrainingSchema.parse({ companyId: 'company-1', courseId: 'c', personId: '' }),
    ).toThrow('Choose a person to assign it to.');
    expect(
      mhdAssignTrainingSchema.parse({ companyId: 'company-1', courseId: 'c', personId: 'p' })
        .courseId,
    ).toBe('c');
  });

  it('a waiver REQUIRES a reason — the field message mirrors the RPC guard', () => {
    expect(() => mhdWaiveAssignmentSchema.parse({ assignmentId: 'a', reason: '   ' })).toThrow(
      'A reason is required to waive an assignment.',
    );
    expect(
      mhdWaiveAssignmentSchema.parse({ assignmentId: 'a', reason: 'Left the company' }).reason,
    ).toBe('Left the company');
  });

  it('admin completion requires a completion date (the frozen-expiry basis)', () => {
    expect(() =>
      mhdRecordAdminCompletionSchema.parse({
        companyId: 'company-1',
        courseId: 'c',
        personId: 'p',
        completedAt: '',
      }),
    ).toThrow('A completion date is required.');
  });
});

describe('training lifecycle and access schemas', () => {
  it('accepts an optional successor when retiring a course', () => {
    expect(
      mhdRetireTrainingCourseSchema.parse({
        courseId: 'course-old',
        successorCourseId: 'course-new',
      }),
    ).toEqual({ courseId: 'course-old', successorCourseId: 'course-new' });
  });

  it('requires an offset-aware license expiry and at least one bulk-assignment person', () => {
    expect(() =>
      mhdSetTrainingContentLicenseSchema.parse({
        companyId: 'company-1',
        courseId: 'course-1',
        expiresAt: '2027-01-01',
      }),
    ).toThrow();
    expect(() =>
      mhdBulkAssignTrainingSchema.parse({
        companyId: 'company-1',
        courseId: 'course-1',
        personIds: [],
      }),
    ).toThrow('Choose at least one person.');
  });
});
