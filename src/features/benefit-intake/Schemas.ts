import { z } from 'zod';
import { noMedicalDetail } from '@/features/accommodations/Schemas';
import { MHD_BENEFIT_INTAKE_REASONS } from './Types';
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');
const freeText = z
  .string()
  .trim()
  .refine(noMedicalDetail, 'Do not enter prohibited medical detail.');
export const mhdBenefitIntakeAnswersSchema = z.object({
  reason: z.enum([
    'OWN_HEALTH',
    'FAMILY_HEALTH',
    'PREGNANCY',
    'BONDING',
    'MILITARY_EXIGENCY',
    'MILITARY_CAREGIVER',
    'OTHER',
  ]),
  needsTimeAway: z.boolean(),
  needsWorkplaceChange: z.boolean(),
});
export const mhdBenefitIntakePayloadSchema = z
  .object({
    subjectPersonId: z.string().uuid().optional(),
    ...mhdBenefitIntakeAnswersSchema.shape,
    familyRelationship: z
      .enum([
        'CHILD',
        'CHILD_ADULT',
        'PARENT',
        'PARENT_IN_LAW',
        'SPOUSE',
        'DOMESTIC_PARTNER',
        'GRANDPARENT',
        'GRANDCHILD',
        'SIBLING',
        'DESIGNATED_PERSON',
        'NEXT_OF_KIN',
      ])
      .optional(),
    requestedStart: isoDate.optional(),
    requestedEnd: isoDate.optional(),
    requestedMode: z.enum(['CONTINUOUS', 'INTERMITTENT', 'REDUCED_SCHEDULE']).optional(),
    bondingEventType: z.enum(['BIRTH', 'ADOPTION', 'FOSTER']).optional(),
    bondingEventDate: isoDate.optional(),
    leaveReasonCategory: freeText.optional(),
    fileCategory: z.string().optional(),
    intakeChannel: z.enum(['HR_ENTRY', 'MANAGER_REFERRAL', 'OTHER']).optional(),
    accommodation: z
      .object({
        requestSummary: freeText,
        requestSource: z.string().optional(),
        requestChannel: z.string().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .optional(),
  })
  .refine((v) => !v.requestedStart || !v.requestedEnd || v.requestedEnd >= v.requestedStart, {
    message: 'The end date must be on or after the start date.',
    path: ['requestedEnd'],
  })
  .superRefine((v, ctx) => {
    if (
      ['FAMILY_HEALTH', 'MILITARY_EXIGENCY', 'MILITARY_CAREGIVER'].includes(v.reason) &&
      !v.familyRelationship
    )
      ctx.addIssue({
        code: 'custom',
        path: ['familyRelationship'],
        message: 'A family relationship is required.',
      });
  });
export const mhdInformationRequestSchema = z
  .object({
    caseType: z.enum(['LEAVE', 'ACCOMMODATION']),
    caseId: z.string().uuid(),
    question: freeText.min(1).max(1000),
    dueDate: isoDate,
  })
  .refine((v) => v.dueDate >= new Date().toISOString().slice(0, 10), {
    message: 'The due date cannot be in the past.',
    path: ['dueDate'],
  });
export const mhdInformationResponseSchema = z.object({
  activityId: z.string().uuid(),
  response: freeText.min(1),
});
export type MhdBenefitIntakeReasonLabel = (typeof MHD_BENEFIT_INTAKE_REASONS)[number];
