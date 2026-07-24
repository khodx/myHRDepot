import { z } from 'zod';
import {
  MHD_COACHING_PLAN_ITEM_STATUSES,
  MHD_COACHING_PLAN_STATUSES,
  MHD_PERFORMANCE_RATING_MAX,
  MHD_PERFORMANCE_RATING_MIN,
  MHD_PERFORMANCE_REVIEW_STATUSES,
  MHD_PERFORMANCE_REVIEW_TYPES,
} from './Types';

const ratingSchema = z
  .number()
  .int('Rating must be a whole number.')
  .min(
    MHD_PERFORMANCE_RATING_MIN,
    `Rating must be between ${MHD_PERFORMANCE_RATING_MIN} and ${MHD_PERFORMANCE_RATING_MAX}.`,
  )
  .max(
    MHD_PERFORMANCE_RATING_MAX,
    `Rating must be between ${MHD_PERFORMANCE_RATING_MIN} and ${MHD_PERFORMANCE_RATING_MAX}.`,
  );

/** Create form: subject, reviewer, type, period, due date, optional meeting link. */
export const mhdPerformanceReviewFormSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    personId: z.string().trim().min(1, 'Review subject is required.'),
    reviewerUserId: z.string().trim().min(1, 'Reviewer is required.'),
    reviewType: z.enum(MHD_PERFORMANCE_REVIEW_TYPES),
    reviewPeriodStart: z.string().trim().min(1, 'Review period start is required.'),
    reviewPeriodEnd: z.string().trim().min(1, 'Review period end is required.'),
    dueDate: z.string().optional().nullable(),
    reviewActivityId: z.string().optional().nullable(),
    overallRating: ratingSchema.optional().nullable(),
    strengthsSummary: z.string().max(10000).optional().nullable(),
    improvementSummary: z.string().max(10000).optional().nullable(),
    goalsSummary: z.string().max(10000).optional().nullable(),
    reviewerComments: z.string().max(10000).optional().nullable(),
    employeeComments: z.string().max(10000).optional().nullable(),
  })
  .refine((form) => form.reviewPeriodEnd >= form.reviewPeriodStart, {
    message: 'Review period end must be on or after the period start.',
    path: ['reviewPeriodEnd'],
  });

/** Content edit form (DRAFT / IN_REVIEW only — content locks from PENDING_SIGNATURE). */
export const mhdPerformanceReviewContentSchema = z.object({
  overallRating: ratingSchema.optional().nullable(),
  strengthsSummary: z.string().max(10000).optional().nullable(),
  improvementSummary: z.string().max(10000).optional().nullable(),
  goalsSummary: z.string().max(10000).optional().nullable(),
  reviewerComments: z.string().max(10000).optional().nullable(),
  employeeComments: z.string().max(10000).optional().nullable(),
  reviewActivityId: z.string().optional().nullable(),
});

/**
 * Lifecycle transition input. `signatureRequestCompleted` reflects the linked
 * e-signature request state at submit time: completing a review without a
 * completed signature request is the waiver path (rule 6) and requires a
 * non-blank waiver reason. The RPC re-validates server-side.
 */
export const mhdPerformanceReviewTransitionSchema = z
  .object({
    newStatus: z.enum(MHD_PERFORMANCE_REVIEW_STATUSES),
    waiverReason: z.string().max(2000).optional().nullable(),
    signatureRequestCompleted: z.boolean().default(false),
  })
  .refine(
    (input) =>
      input.newStatus !== 'COMPLETED' ||
      input.signatureRequestCompleted ||
      Boolean(input.waiverReason && input.waiverReason.trim().length > 0),
    {
      message: 'A waiver reason is required to complete a review without a signed acknowledgment.',
      path: ['waiverReason'],
    },
  );

export const mhdPerformanceReviewFilterSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  personId: z.string().default('ALL'),
  reviewerUserId: z.string().default('ALL'),
  reviewType: z.union([z.enum(MHD_PERFORMANCE_REVIEW_TYPES), z.literal('ALL')]).default('ALL'),
  status: z.union([z.enum(MHD_PERFORMANCE_REVIEW_STATUSES), z.literal('ALL')]).default('ALL'),
  searchTerm: z.string().default(''),
  dueFrom: z.string().default(''),
  dueTo: z.string().default(''),
});

export const mhdCoachingPlanFormSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    personId: z.string().trim().min(1, 'Coached employee is required.'),
    coachUserId: z.string().trim().min(1, 'Coach is required.'),
    title: z
      .string()
      .min(1, 'Title is required.')
      .max(200, 'Title must be 200 characters or fewer.')
      .refine((value) => value.trim().length > 0, {
        message: 'Title cannot be blank.',
      }),
    objective: z.string().max(10000).optional().nullable(),
    startDate: z.string().optional().nullable(),
    targetDate: z.string().optional().nullable(),
    sourceReviewId: z.string().optional().nullable(),
    outcomeSummary: z.string().max(10000).optional().nullable(),
  })
  .refine((form) => !form.startDate || !form.targetDate || form.targetDate >= form.startDate, {
    message: 'Target date must be on or after the start date.',
    path: ['targetDate'],
  });

export const mhdCoachingPlanTransitionSchema = z.object({
  newStatus: z.enum(MHD_COACHING_PLAN_STATUSES),
  outcomeSummary: z.string().max(10000).optional().nullable(),
});

export const mhdCoachingPlanItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.')
    .refine((value) => value.trim().length > 0, {
      message: 'Title cannot be blank.',
    }),
  description: z.string().max(10000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(MHD_COACHING_PLAN_ITEM_STATUSES).default('PLANNED'),
  activityId: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const mhdCoachingPlanFilterSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  personId: z.string().default('ALL'),
  coachUserId: z.string().default('ALL'),
  status: z.union([z.enum(MHD_COACHING_PLAN_STATUSES), z.literal('ALL')]).default('ALL'),
  searchTerm: z.string().default(''),
});

export type MhdPerformanceReviewFormSchemaInput = z.infer<typeof mhdPerformanceReviewFormSchema>;
export type MhdPerformanceReviewContentSchemaInput = z.infer<
  typeof mhdPerformanceReviewContentSchema
>;
export type MhdPerformanceReviewTransitionSchemaInput = z.infer<
  typeof mhdPerformanceReviewTransitionSchema
>;
export type MhdPerformanceReviewFilterSchemaInput = z.infer<
  typeof mhdPerformanceReviewFilterSchema
>;
export type MhdCoachingPlanFormSchemaInput = z.infer<typeof mhdCoachingPlanFormSchema>;
export type MhdCoachingPlanTransitionSchemaInput = z.infer<typeof mhdCoachingPlanTransitionSchema>;
export type MhdCoachingPlanItemSchemaInput = z.infer<typeof mhdCoachingPlanItemSchema>;
export type MhdCoachingPlanFilterSchemaInput = z.infer<typeof mhdCoachingPlanFilterSchema>;
export const mhdReviewFormSchema = mhdPerformanceReviewFormSchema;
export type MhdReviewFormSchemaInput = MhdPerformanceReviewFormSchemaInput;
export const mhdReviewWaiverSchema = z.object({ waiverReason: z.string().trim().min(1).max(2000) });
export type MhdReviewWaiverSchemaInput = z.infer<typeof mhdReviewWaiverSchema>;
export const mhdReviewBoardFilterSchema = mhdPerformanceReviewFilterSchema;
export const mhdCoachingPlanBoardFilterSchema = mhdCoachingPlanFilterSchema;
