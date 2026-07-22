import { describe, expect, it } from 'vitest';
import {
  mhdAssignTrainingSchema,
  mhdRecordAdminCompletionSchema,
  mhdTrainingCourseFormSchema,
  mhdWaiveAssignmentSchema,
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

describe('training assignment / waiver / admin-completion schemas', () => {
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
    expect(mhdWaiveAssignmentSchema.parse({ assignmentId: 'a', reason: 'Left the company' }).reason)
      .toBe('Left the company');
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
