import { z } from 'zod';
import { MHD_OFFBOARDING_CASE_STATUSES, MHD_SEPARATION_TYPES } from './Types';

/** Create/edit form: subject, separation facts, rehire tri-state, optional exit-interview link. */
export const mhdCaseFormSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    personId: z.string().trim().min(1, 'Separating employee is required.'),
    separationType: z.enum(MHD_SEPARATION_TYPES),
    separationDate: z.string().trim().min(1, 'Separation date is required.'),
    lastWorkingDay: z.string().optional().nullable(),
    reasonSummary: z.string().max(10000).optional().nullable(),
    eligibleForRehire: z.enum(['', 'YES', 'NO']).default(''),
  })
  .refine((form) => !form.lastWorkingDay || form.lastWorkingDay >= form.separationDate, {
    message: 'Last working day must be on or after the separation date.',
    path: ['lastWorkingDay'],
  });

/**
 * Lifecycle transition input. CANCELLED (separation rescinded) requires a
 * non-blank cancel reason. The COMPLETED gate (every required item terminal)
 * is server-side state, not form input — the RPC enforces it.
 */
export const mhdCaseCancelSchema = z.object({
  cancelReason: z
    .string()
    .trim()
    .min(1, 'A cancellation reason is required to cancel an offboarding case.')
    .max(2000),
});

/** Custom checklist item create/edit form (content fields; status moves via the status schema). */
export const mhdCustomItemSchema = z.object({
  caseId: z.string().trim().min(1, 'Case is required.'),
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.')
    .refine((value) => value.trim().length > 0, {
      message: 'Title cannot be blank.',
    }),
  description: z.string().max(10000).optional().nullable(),
  isRequired: z.boolean().default(true),
  dueDate: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
});

/**
 * Checklist item status change (complete / waive / not-applicable dialogs).
 * WAIVED and NOT_APPLICABLE require a non-blank reason (audited `ITEM_WAIVED`);
 * the `property_return` / `exit_acknowledgment` COMPLETED gates are RPC-enforced.
 */
export const mhdItemWaiverSchema = z.object({
  status: z.enum(['WAIVED', 'NOT_APPLICABLE']),
  reason: z
    .string()
    .default('')
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'A reason is required to waive an item or mark it not applicable.')
        .max(2000),
    ),
});

export const mhdExitInterviewQuickCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  activityDate: z.string().trim().min(1, 'Date is required.'),
});

export const mhdOffboardingCaseFilterSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  personId: z.string().default('ALL'),
  separationType: z.union([z.enum(MHD_SEPARATION_TYPES), z.literal('ALL')]).default('ALL'),
  status: z.union([z.enum(MHD_OFFBOARDING_CASE_STATUSES), z.literal('ALL')]).default('ALL'),
  searchTerm: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
});

export type MhdCaseFormSchemaInput = z.infer<typeof mhdCaseFormSchema>;
export type MhdCaseCancelSchemaInput = z.infer<typeof mhdCaseCancelSchema>;
export type MhdCustomItemSchemaInput = z.infer<typeof mhdCustomItemSchema>;
export type MhdItemWaiverSchemaInput = z.infer<typeof mhdItemWaiverSchema>;
export type MhdExitInterviewQuickCreateSchemaInput = z.infer<
  typeof mhdExitInterviewQuickCreateSchema
>;
export type MhdOffboardingCaseFilterSchemaInput = z.infer<typeof mhdOffboardingCaseFilterSchema>;
