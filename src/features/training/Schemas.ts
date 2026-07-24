import { z } from 'zod';
import { MHD_TRAINING_CATEGORIES, MHD_TRAINING_DELIVERY_MODES } from './Types';

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

/**
 * Authoring / editing a company course. `courseKey` is the stable identifier
 * (unique per scope via the two-partial-index NULL-distinct pattern) — required
 * on create. `recurrenceMonths` is OPTIONAL and, when blank, means a one-time
 * course with no expiry; when present it must be a positive integer (the column
 * CHECK is `null or > 0`, mirrored here). `durationMinutes` follows the same
 * null-or-positive rule. This schema validates the payload only; the server
 * remains the authority on who may author a course and refuses a global course.
 *
 * zod v4: enum options carry no `errorMap`, and `z.coerce.number()` takes no
 * `invalid_type_error` — the per-check messages (`.int()`, `.positive()`) carry
 * the wording instead, matching the app's leaves / tasks idioms.
 */
export const mhdTrainingCourseFormSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseKey: z
    .string()
    .trim()
    .min(1, 'A course key is required.')
    .max(120, 'That course key is longer than the record supports.'),
  title: z
    .string()
    .trim()
    .min(1, 'A title is required.')
    .max(300, 'That title is longer than the record supports.'),
  description: z.string().trim().max(4000).optional().nullable(),
  category: z.enum(MHD_TRAINING_CATEGORIES),
  deliveryMode: z.enum(MHD_TRAINING_DELIVERY_MODES),
  // The number inputs hand back strings, and an empty field means "unset" — a
  // blank recurrence is a deliberate one-time course, NOT zero. Preprocess maps
  // '' / null / undefined to null BEFORE the numeric checks, so a blank field is
  // valid null rather than a coerced 0 that would fail `.positive()`.
  durationMinutes: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number()
      .int('Minutes must be a whole number.')
      .positive('Minutes must be greater than zero.')
      .nullable(),
  ),
  recurrenceMonths: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number()
      .int('Months must be a whole number.')
      .positive('Months must be greater than zero.')
      .nullable(),
  ),
  requiresEvidence: z.boolean().default(false),
  externalUrl: z
    .string()
    .trim()
    .url('Enter a valid URL.')
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

/**
 * Assigning a course to a person. `dueDate` is optional (a course may be assigned
 * without a deadline). The one-live-assignment-per-person-per-course guard is a
 * server invariant (partial unique index) — this schema does not attempt it.
 */
export const mhdAssignTrainingSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseId: z.string().trim().min(1, 'Choose a course to assign.'),
  personId: z.string().trim().min(1, 'Choose a person to assign it to.'),
  dueDate: z.string().trim().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Waiver
// ---------------------------------------------------------------------------

/**
 * Waiving an assignment. A reason is REQUIRED — the RPC raises
 * `A waiver requires a reason` otherwise — so the refinement turns a would-be
 * save failure into a field message.
 */
export const mhdWaiveAssignmentSchema = z.object({
  assignmentId: z.string().trim().min(1),
  reason: z
    .string()
    .trim()
    .min(1, 'A reason is required to waive an assignment.')
    .max(2000, 'That reason is longer than the record supports.'),
});

// ---------------------------------------------------------------------------
// Admin-recorded completion
// ---------------------------------------------------------------------------

/**
 * An admin recording a past completion for a person with no standing assignment.
 * `completedAt` is required (it is what the frozen expiry is computed from) and
 * may be backdated. The certificate `attachmentId` is optional.
 */
export const mhdRecordAdminCompletionSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseId: z.string().trim().min(1, 'Choose a course.'),
  personId: z.string().trim().min(1, 'Choose a person.'),
  completedAt: z.string().trim().min(1, 'A completion date is required.'),
  attachmentId: z.string().trim().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdTrainingCourseFormValues = z.infer<typeof mhdTrainingCourseFormSchema>;
export type MhdAssignTrainingFormValues = z.infer<typeof mhdAssignTrainingSchema>;
export type MhdWaiveAssignmentFormValues = z.infer<typeof mhdWaiveAssignmentSchema>;
export type MhdRecordAdminCompletionFormValues = z.infer<typeof mhdRecordAdminCompletionSchema>;
