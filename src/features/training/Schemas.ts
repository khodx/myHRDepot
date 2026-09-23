import { z } from 'zod';
import {
  MHD_TRAINING_APPROVAL_STATUSES,
  MHD_TRAINING_BLOCK_TYPES,
  MHD_TRAINING_CATEGORIES,
  MHD_TRAINING_CONTENT_MODES,
  MHD_TRAINING_DELIVERY_MODES,
  MHD_TRAINING_FORK_STATES,
  MHD_TRAINING_ASSIGNMENT_SOURCE_TYPES,
  MHD_TRAINING_COMPLIANCE_RULE_TARGET_TYPES,
  MHD_TRAINING_SELF_ENROLLMENT_STATUSES,
} from './Types';

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
  sourceType: z.enum(MHD_TRAINING_ASSIGNMENT_SOURCE_TYPES).optional(),
  sourceId: z.string().trim().min(1).optional().nullable(),
  isEmergencyPriority: z.boolean().optional(),
});

export const mhdCreateTrainingComplianceRuleSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    title: z.string().trim().min(1, 'A title is required.').max(300),
    targetType: z.enum(MHD_TRAINING_COMPLIANCE_RULE_TARGET_TYPES),
    courseId: z.string().trim().min(1, 'Choose a course.'),
    targetDepartment: z.string().trim().min(1).optional().nullable(),
    targetJobId: z.string().trim().min(1).optional().nullable(),
    targetJurisdiction: z.string().trim().min(1).optional().nullable(),
    dueOffsetDays: z.coerce.number().int().optional().nullable(),
  })
  .refine(
    (value) => {
      const fields = [value.targetDepartment, value.targetJobId, value.targetJurisdiction];
      const populated = fields.filter((field) => field != null && field.trim() !== '').length;
      const matching =
        (value.targetType === 'ORG_UNIT' && value.targetDepartment) ||
        (value.targetType === 'JOB_TITLE' && value.targetJobId) ||
        (value.targetType === 'JURISDICTION' && value.targetJurisdiction);
      return populated === 1 && Boolean(matching);
    },
    {
      message: 'Set exactly one target field matching the target type.',
      path: ['targetType'],
    },
  );

export const mhdSelfEnrollTrainingSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseId: z.string().trim().min(1, 'Choose a course.'),
});

export const mhdListTrainingSelfEnrollmentsSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  status: z.enum(MHD_TRAINING_SELF_ENROLLMENT_STATUSES).optional().nullable(),
});

export const mhdDecideTrainingSelfEnrollmentSchema = z.object({
  requestId: z.string().trim().min(1),
  approve: z.boolean(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const mhdAssignTrainingProgramSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  programId: z.string().trim().min(1, 'Choose a program.'),
  personId: z.string().trim().min(1, 'Choose a person.'),
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
// LMS v2 content authoring
// ---------------------------------------------------------------------------

const requiredTitle = z.string().trim().min(1, 'A title is required.').max(300);
const optionalDescription = z.string().trim().max(4000).optional().nullable();
const sortOrder = z.number().int().min(0).default(0);

export const mhdCreateCurriculumSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  title: requiredTitle,
  description: optionalDescription,
});

export const mhdTrainingProgramFiltersSchema = z.object({
  companyId: z.string().trim().min(1).nullable(),
  curriculumId: z.string().trim().min(1).optional().nullable(),
});

export const mhdCreateProgramSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  title: requiredTitle,
  curriculumId: z.string().trim().min(1).optional().nullable(),
  description: optionalDescription,
  sortOrder,
});

export const mhdCreateCourseModuleSchema = z.object({
  courseId: z.string().trim().min(1, 'Choose a course.'),
  title: requiredTitle,
  description: optionalDescription,
  sortOrder,
});

export const mhdCreateLessonSchema = z.object({
  moduleId: z.string().trim().min(1, 'Choose a module.'),
  title: requiredTitle,
  description: optionalDescription,
  sortOrder,
});

export const mhdCreateBlockSchema = z.object({
  lessonId: z.string().trim().min(1, 'Choose a lesson.'),
  blockType: z.enum(MHD_TRAINING_BLOCK_TYPES),
  content: z.record(z.string(), z.unknown()).default({}),
  title: z.string().trim().max(300).optional().nullable(),
  sortOrder,
  altText: z.string().trim().max(2000).optional().nullable(),
  transcript: z.string().trim().max(20000).optional().nullable(),
});

export const mhdSetCourseContentModeSchema = z.object({
  courseId: z.string().trim().min(1, 'Choose a course.'),
  contentMode: z.enum(MHD_TRAINING_CONTENT_MODES),
});

export const mhdForkCourseSchema = z.object({
  courseId: z.string().trim().min(1, 'Choose a course.'),
  companyId: z.string().trim().min(1, 'Company is required.'),
});

export const mhdSubmitContentForReviewSchema = z.object({ courseId: z.string().trim().min(1) });
export const mhdApproveContentSchema = z.object({
  courseId: z.string().trim().min(1),
  reviewNotes: z.string().trim().max(4000).optional().nullable(),
});
export const mhdPublishContentSchema = z.object({ courseId: z.string().trim().min(1) });
export const mhdPrerequisiteSchema = z.object({
  courseId: z.string().trim().min(1),
  prerequisiteCourseId: z.string().trim().min(1),
});

export const mhdTrainingApprovalStatusSchema = z.enum(MHD_TRAINING_APPROVAL_STATUSES);
export const mhdTrainingForkStateSchema = z.enum(MHD_TRAINING_FORK_STATES);

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdTrainingCourseFormValues = z.infer<typeof mhdTrainingCourseFormSchema>;
export type MhdAssignTrainingFormValues = z.infer<typeof mhdAssignTrainingSchema>;
export type MhdCreateTrainingComplianceRuleFormValues = z.infer<
  typeof mhdCreateTrainingComplianceRuleSchema
>;
export type MhdSelfEnrollTrainingFormValues = z.infer<typeof mhdSelfEnrollTrainingSchema>;
export type MhdListTrainingSelfEnrollmentsFormValues = z.infer<
  typeof mhdListTrainingSelfEnrollmentsSchema
>;
export type MhdDecideTrainingSelfEnrollmentFormValues = z.infer<
  typeof mhdDecideTrainingSelfEnrollmentSchema
>;
export type MhdAssignTrainingProgramFormValues = z.infer<typeof mhdAssignTrainingProgramSchema>;
export type MhdWaiveAssignmentFormValues = z.infer<typeof mhdWaiveAssignmentSchema>;
export type MhdRecordAdminCompletionFormValues = z.infer<typeof mhdRecordAdminCompletionSchema>;
export type MhdCreateCurriculumFormValues = z.infer<typeof mhdCreateCurriculumSchema>;
export type MhdCreateProgramFormValues = z.infer<typeof mhdCreateProgramSchema>;
export type MhdCreateCourseModuleFormValues = z.infer<typeof mhdCreateCourseModuleSchema>;
export type MhdCreateLessonFormValues = z.infer<typeof mhdCreateLessonSchema>;
export type MhdCreateBlockFormValues = z.infer<typeof mhdCreateBlockSchema>;

const mhdTrainingProgressStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']);
const mhdTrainingTreeBlockSchema = z.object({
  id: z.string(),
  blockType: z.enum(MHD_TRAINING_BLOCK_TYPES),
  title: z.string().nullable(),
  content: z.record(z.string(), z.unknown()),
  sortOrder: z.number(),
  altText: z.string().nullable(),
  transcript: z.string().nullable(),
});

export const mhdTrainingContentTreeSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    sortOrder: z.number(),
    lessons: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        sortOrder: z.number(),
        blocks: z.array(mhdTrainingTreeBlockSchema),
      }),
    ),
  }),
);

export const mhdTrainingBlockProgressSchema = z.object({
  block_id: z.string(),
  status: mhdTrainingProgressStatusSchema,
  response: z.record(z.string(), z.unknown()).nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type MhdTrainingContentTreeValues = z.infer<typeof mhdTrainingContentTreeSchema>;
