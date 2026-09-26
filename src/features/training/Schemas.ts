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
  MHD_TRAINING_DEFAULT_MAX_SESSION_MINUTES,
  MHD_TRAINING_VIDEO_MAX_FILE_SIZE_BYTES,
  MHD_TRAINING_VIDEO_MIME_TYPES,
} from './Types';

export const mhdContentFlagEntityTypeSchema = z.enum([
  'TASK',
  'SUBTASK',
  'ACTIVITY',
  'TRAINING_LESSON',
  'NOTE',
]);
export const mhdContentFlagStatusSchema = z.enum(['PENDING', 'RESOLVED']);
export const mhdContentFlagResolveActionSchema = z.enum(['NONE', 'HIDDEN', 'REMOVED', 'WARNED']);

export const mhdCreateTrainingBadgeSchema = z.object({
  companyId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(4000).optional().nullable(),
  iconKey: z.string().trim().min(1).max(100).default('award'),
});
export const mhdAwardTrainingBadgeSchema = z.object({
  badgeId: z.string().trim().min(1),
  personId: z.string().trim().min(1),
  reason: z.string().trim().max(4000).optional().nullable(),
});
export const mhdSetTrainingLeaderboardOptInSchema = z.object({ optedIn: z.boolean() });
export const mhdTrainingLeaderboardSchema = z.object({
  companyId: z.string().trim().min(1),
  limit: z.number().int().positive().max(100).default(20),
});
export const mhdCreateContentFlagSchema = z.object({
  entityType: mhdContentFlagEntityTypeSchema,
  entityId: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(4000),
});
export const mhdListContentFlagsSchema = z.object({
  companyId: z.string().trim().min(1),
  status: mhdContentFlagStatusSchema.default('PENDING'),
});
export const mhdResolveContentFlagSchema = z.object({
  flagId: z.string().trim().min(1),
  action: mhdContentFlagResolveActionSchema,
  notes: z.string().trim().max(4000).optional().nullable(),
});
export const mhdAssignTrainingPeerReviewSchema = z.object({
  blockProgressId: z.string().trim().min(1),
  reviewerPersonId: z.string().trim().min(1),
});
export const mhdSubmitTrainingPeerReviewSchema = z.object({
  reviewId: z.string().trim().min(1),
  rubricScore: z.number().min(0),
  feedback: z.string().trim().min(1).max(10000),
});
export const mhdListTrainingPeerReviewsSchema = z.object({
  blockProgressId: z.string().trim().min(1),
});
export const mhdSubmitTrainingCourseFeedbackSchema = z.object({
  courseId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comments: z.string().trim().max(10000).optional().nullable(),
});

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

export const mhdRetireTrainingCourseSchema = z.object({
  courseId: z.string().trim().min(1, 'Choose a course to retire.'),
  successorCourseId: z.string().trim().min(1).optional().nullable(),
});

export const mhdResolveActiveSuccessorSchema = z.object({
  courseId: z.string().trim().min(1, 'Choose a course.'),
});

export const mhdSetTrainingContentLicenseSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseId: z.string().trim().min(1, 'Choose a global course.'),
  expiresAt: z.string().datetime({ offset: true }),
});

export const mhdTrainingManagerTeamStatusSchema = z.object({
  managerPersonId: z.string().trim().min(1, 'Choose a manager.'),
});

export const mhdBulkAssignTrainingSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseId: z.string().trim().min(1, 'Choose a course to assign.'),
  personIds: z.array(z.string().trim().min(1)).min(1, 'Choose at least one person.'),
  dueDate: z.string().trim().optional().nullable(),
});

export const mhdSendTrainingDeadlineRemindersSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  daysBefore: z.coerce.number().int().default(7),
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

export const mhdGenerateTrainingCertificateSchema = z.object({
  completionId: z.string().trim().min(1, 'Completion is required.'),
});

export const mhdSetTrainingTimeOnTaskSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  maxSessionMinutes: z.coerce
    .number()
    .int()
    .positive()
    .default(MHD_TRAINING_DEFAULT_MAX_SESSION_MINUTES),
});

export const mhdTrainingTimeOnTaskFiltersSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.').nullable(),
  personId: z.string().trim().min(1).optional().nullable(),
  from: z.string().date().optional().nullable(),
  to: z.string().date().optional().nullable(),
});

export const mhdCreateTrainingExternalAuditorGrantSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  courseId: z.string().trim().min(1, 'Choose a course.'),
  auditorLabel: z.string().trim().min(1, 'An auditor label is required.').max(300),
  validUntil: z.string().datetime({ offset: true }),
});

export const mhdTrainingExternalAuditorGrantRevokeSchema = z.object({
  grantId: z.string().trim().min(1),
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
export type MhdRetireTrainingCourseFormValues = z.infer<typeof mhdRetireTrainingCourseSchema>;
export type MhdResolveActiveSuccessorFormValues = z.infer<typeof mhdResolveActiveSuccessorSchema>;
export type MhdSetTrainingContentLicenseFormValues = z.infer<
  typeof mhdSetTrainingContentLicenseSchema
>;
export type MhdTrainingManagerTeamStatusFormValues = z.infer<
  typeof mhdTrainingManagerTeamStatusSchema
>;
export type MhdBulkAssignTrainingFormValues = z.infer<typeof mhdBulkAssignTrainingSchema>;
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
export type MhdSetTrainingTimeOnTaskFormValues = z.infer<typeof mhdSetTrainingTimeOnTaskSchema>;
export type MhdTrainingTimeOnTaskFiltersValues = z.infer<typeof mhdTrainingTimeOnTaskFiltersSchema>;
export type MhdCreateTrainingExternalAuditorGrantFormValues = z.infer<
  typeof mhdCreateTrainingExternalAuditorGrantSchema
>;
export type MhdTrainingExternalAuditorGrantRevokeFormValues = z.infer<
  typeof mhdTrainingExternalAuditorGrantRevokeSchema
>;
export type MhdCreateCurriculumFormValues = z.infer<typeof mhdCreateCurriculumSchema>;
export type MhdCreateProgramFormValues = z.infer<typeof mhdCreateProgramSchema>;
export type MhdCreateCourseModuleFormValues = z.infer<typeof mhdCreateCourseModuleSchema>;
export type MhdCreateLessonFormValues = z.infer<typeof mhdCreateLessonSchema>;
export type MhdCreateBlockFormValues = z.infer<typeof mhdCreateBlockSchema>;
export type MhdCreateTrainingBadgeFormValues = z.infer<typeof mhdCreateTrainingBadgeSchema>;
export type MhdAwardTrainingBadgeFormValues = z.infer<typeof mhdAwardTrainingBadgeSchema>;
export type MhdCreateContentFlagFormValues = z.infer<typeof mhdCreateContentFlagSchema>;
export type MhdResolveContentFlagFormValues = z.infer<typeof mhdResolveContentFlagSchema>;
export type MhdAssignTrainingPeerReviewFormValues = z.infer<
  typeof mhdAssignTrainingPeerReviewSchema
>;
export type MhdSubmitTrainingPeerReviewFormValues = z.infer<
  typeof mhdSubmitTrainingPeerReviewSchema
>;
export type MhdSubmitTrainingCourseFeedbackFormValues = z.infer<
  typeof mhdSubmitTrainingCourseFeedbackSchema
>;

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

export const mhdTrainingVideoUploadSchema = z
  .object({
    blockId: z.string().trim().min(1, 'A video block is required.'),
    file: z.custom<File>(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as File).name === 'string' &&
        typeof (value as File).type === 'string' &&
        typeof (value as File).size === 'number',
      'A video file is required.',
    ),
  })
  .superRefine(({ file }, ctx) => {
    if (
      !MHD_TRAINING_VIDEO_MIME_TYPES.includes(
        file.type as (typeof MHD_TRAINING_VIDEO_MIME_TYPES)[number],
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['file'],
        message: 'Unsupported video type. Use MP4, WebM, QuickTime, or Matroska.',
      });
    }
    if (file.size > MHD_TRAINING_VIDEO_MAX_FILE_SIZE_BYTES) {
      ctx.addIssue({
        code: 'custom',
        path: ['file'],
        message: 'Video files must be 5GB or smaller.',
      });
    }
  });

export const mhdTrainingBlockProgressSchema = z.object({
  block_id: z.string(),
  status: mhdTrainingProgressStatusSchema,
  response: z.record(z.string(), z.unknown()).nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type MhdTrainingContentTreeValues = z.infer<typeof mhdTrainingContentTreeSchema>;
