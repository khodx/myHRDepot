import { z } from 'zod';
import {
  MHD_ATTENDANCE_ACTION_LEVELS,
  MHD_ATTENDANCE_CLASSIFICATIONS,
  MHD_OCCURRENCE_TYPES,
  MHD_PROTECTED_LEAVE_CATEGORIES,
  MHD_THRESHOLD_EVENT_STATUSES,
} from './Types';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');
const isoTime = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use a HH:MM time.');

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

/**
 * One day of a weekly pattern. The times-match-flag rule is a database CHECK
 * (`schedule_template_days_times_match_flag`); mirroring it here turns a
 * constraint violation into a field-level message instead of a save failure.
 */
export const mhdScheduleTemplateDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isWorkingDay: z.boolean(),
    startTime: isoTime.optional().nullable(),
    endTime: isoTime.optional().nullable(),
    unpaidBreakMinutes: z.number().int().min(0).max(480).default(0),
  })
  .refine((day) => !day.isWorkingDay || Boolean(day.startTime && day.endTime), {
    message: 'A working day needs both a start and an end time.',
    path: ['startTime'],
  })
  .refine(
    (day) => !day.isWorkingDay || !day.startTime || !day.endTime || day.endTime > day.startTime,
    {
      message: 'End time must be after start time.',
      path: ['endTime'],
    },
  )
  .refine((day) => day.isWorkingDay || (!day.startTime && !day.endTime), {
    message: 'A non-working day must not carry times.',
    path: ['startTime'],
  });

export const mhdScheduleTemplateFormSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  templateName: z.string().trim().min(1, 'Template name is required.').max(200),
  description: z.string().max(2000).optional().nullable(),
  days: z
    .array(mhdScheduleTemplateDaySchema)
    .length(7, 'A weekly pattern needs all seven days.')
    .refine(
      (days) => new Set(days.map((day) => day.dayOfWeek)).size === 7,
      'Each day of the week must appear exactly once.',
    )
    .refine(
      (days) => days.some((day) => day.isWorkingDay),
      'A schedule with no working days would never produce a shift.',
    ),
});

export const mhdScheduleAssignmentSchema = z.object({
  personId: z.string().trim().min(1, 'Employee is required.'),
  templateId: z.string().trim().min(1, 'Schedule template is required.'),
  effectiveFrom: isoDate,
  note: z.string().max(2000).optional().nullable(),
});

export const mhdGenerateShiftsSchema = z
  .object({
    personId: z.string().trim().min(1, 'Employee is required.'),
    from: isoDate,
    to: isoDate,
  })
  .refine((input) => input.to >= input.from, {
    message: 'End date must be on or after the start date.',
    path: ['to'],
  })
  // Mirrors the RPC's own two-year guard so the UI fails fast rather than
  // round-tripping a range the server will refuse.
  .refine((input) => (Date.parse(input.to) - Date.parse(input.from)) / 86_400_000 <= 731, {
    message: 'Generate at most two years of shifts per run.',
    path: ['to'],
  });

export const mhdOverrideShiftSchema = z
  .object({
    shiftId: z.string().trim().min(1),
    startTime: isoTime,
    endTime: isoTime,
    unpaidBreakMinutes: z.number().int().min(0).max(480).optional().nullable(),
    reason: z.string().trim().min(1, 'An override reason is required.').max(2000),
  })
  .refine((input) => input.endTime > input.startTime, {
    message: 'End time must be after start time.',
    path: ['endTime'],
  });

export const mhdCompanyHolidaySchema = z.object({
  companyId: z.string().trim().min(1),
  holidayDate: isoDate,
  holidayName: z.string().trim().min(1, 'Holiday name is required.').max(200),
  isPaid: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Occurrences
// ---------------------------------------------------------------------------

/**
 * THE module invariant, mirrored client-side.
 *
 * The database enforces the classification/category pairing in both directions
 * (`attendance_occurrences_protected_category_pairing`) and refuses points on a
 * protected occurrence via `trg_point_ledger_protected_guard`. Neither of those
 * can be reached from this form, because the two refinements below make the
 * illegal shapes unrepresentable in the payload.
 *
 * These checks exist for the message, not the enforcement. The server remains
 * the authority; a client that skipped validation entirely would still be
 * refused.
 */
export const mhdOccurrenceFormSchema = z
  .object({
    personId: z.string().trim().min(1, 'Employee is required.'),
    occurrenceDate: isoDate,
    occurrenceType: z.enum(MHD_OCCURRENCE_TYPES),
    classification: z.enum(MHD_ATTENDANCE_CLASSIFICATIONS),
    protectedLeaveCategory: z.enum(MHD_PROTECTED_LEAVE_CATEGORIES).optional().nullable(),
    minutesVariance: z.number().int().min(0).max(1440).optional().nullable(),
    reasonNote: z.string().max(2000).optional().nullable(),
    scheduledShiftId: z.string().optional().nullable(),
  })
  .refine((form) => form.classification !== 'PROTECTED' || Boolean(form.protectedLeaveCategory), {
    message:
      'Protected leave requires a category — it is what keeps the absence from accruing points.',
    path: ['protectedLeaveCategory'],
  })
  .refine((form) => form.classification === 'PROTECTED' || !form.protectedLeaveCategory, {
    message: 'Only a protected absence may carry a protected-leave category.',
    path: ['protectedLeaveCategory'],
  });

export const mhdUpdateOccurrenceSchema = z.object({
  occurrenceId: z.string().trim().min(1),
  occurrenceType: z.enum(MHD_OCCURRENCE_TYPES).optional().nullable(),
  minutesVariance: z.number().int().min(0).max(1440).optional().nullable(),
  reasonNote: z.string().max(2000).optional().nullable(),
});
// Note: classification is deliberately absent. It moves only through
// mhdReclassifyOccurrenceSchema, so the automatic-reversal path in 0032 can
// never be bypassed by an ordinary field edit.

export const mhdReclassifyOccurrenceSchema = z
  .object({
    occurrenceId: z.string().trim().min(1),
    classification: z.enum(MHD_ATTENDANCE_CLASSIFICATIONS),
    protectedLeaveCategory: z.enum(MHD_PROTECTED_LEAVE_CATEGORIES).optional().nullable(),
    reason: z.string().max(2000).optional().nullable(),
  })
  .refine((form) => form.classification !== 'PROTECTED' || Boolean(form.protectedLeaveCategory), {
    message: 'Protected leave requires a category.',
    path: ['protectedLeaveCategory'],
  })
  .refine((form) => form.classification === 'PROTECTED' || !form.protectedLeaveCategory, {
    message: 'Only a protected absence may carry a protected-leave category.',
    path: ['protectedLeaveCategory'],
  });

export const mhdVoidOccurrenceSchema = z.object({
  occurrenceId: z.string().trim().min(1),
  reason: z.string().trim().min(1, 'A reason is required to void an occurrence.').max(2000),
});

// ---------------------------------------------------------------------------
// Points and thresholds
// ---------------------------------------------------------------------------

export const mhdAdjustPointsSchema = z
  .object({
    personId: z.string().trim().min(1, 'Employee is required.'),
    pointsDelta: z.number().refine((value) => value !== 0, 'An adjustment must be non-zero.'),
    reason: z.string().trim().min(1, 'A reason is required for a manual adjustment.').max(2000),
    effectiveDate: isoDate.optional().nullable(),
    occurrenceId: z.string().optional().nullable(),
  })
  .refine((form) => Math.abs(form.pointsDelta) <= 999, {
    message: 'Adjustment is out of range.',
    path: ['pointsDelta'],
  });

export const mhdResolveThresholdEventSchema = z
  .object({
    eventId: z.string().trim().min(1),
    status: z.enum(MHD_THRESHOLD_EVENT_STATUSES).exclude(['RAISED']),
    resolutionNote: z.string().max(2000).optional().nullable(),
    linkedTaskId: z.string().optional().nullable(),
  })
  .refine(
    (form) =>
      form.status !== 'DISMISSED' ||
      Boolean(form.resolutionNote && form.resolutionNote.trim().length > 0),
    {
      message:
        'Dismissing a threshold event requires a reason — the record is the defence if the decision is ever challenged.',
      path: ['resolutionNote'],
    },
  );

/**
 * Resolving a reassessment. The reason is required on BOTH outcomes, not just
 * on decline — that symmetry is the point. A declined item with no recorded
 * reason cannot be told apart from one nobody looked at, and the queue exists
 * to make exactly that distinction provable.
 */
export const mhdResolveReassessmentSchema = z
  .object({
    eventId: z.string().trim().min(1),
    decision: z.enum(['ASSESSED', 'DECLINED']),
    decisionNote: z
      .string()
      .trim()
      .min(
        1,
        'A written reason is required either way — it is what evidences consistent application.',
      )
      .max(2000),
    points: z
      .number()
      .positive('Assessed points must be above zero.')
      .max(99)
      .optional()
      .nullable(),
    effectiveDate: isoDate.optional().nullable(),
  })
  .refine((form) => form.decision === 'ASSESSED' || form.points == null, {
    message: 'Points cannot be set when declining to assess.',
    path: ['points'],
  })
  .refine((form) => form.decision === 'ASSESSED' || form.effectiveDate == null, {
    message: 'An effective date cannot be set when declining to assess.',
    path: ['effectiveDate'],
  });

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

/**
 * There is no `protectedAccrues` field, deliberately and permanently. The
 * database has no such column: offering the toggle would invite an unlawful
 * configuration. Do not add one here to "round out" the form.
 */
export const mhdAttendancePolicySchema = z
  .object({
    companyId: z.string().trim().min(1),
    policyName: z.string().trim().min(1, 'Policy name is required.').max(200),
    effectiveFrom: isoDate,
    rollOffMonths: z
      .number()
      .int()
      .min(1, 'Roll-off must be at least one month.')
      .max(120, 'Roll-off longer than ten years is almost certainly a mistake.'),
    excusedUnpaidAccrues: z.boolean().default(false),
    excusedPaidAccrues: z.boolean().default(false),
    pointRules: z
      .array(
        z.object({
          occurrenceType: z.enum(MHD_OCCURRENCE_TYPES),
          points: z.number().min(0, 'Points cannot be negative.').max(99),
        }),
      )
      .refine(
        (rules) => new Set(rules.map((rule) => rule.occurrenceType)).size === rules.length,
        'Each occurrence type may appear only once.',
      ),
    thresholds: z
      .array(
        z.object({
          pointsAt: z.number().positive('A threshold must be above zero points.').max(999),
          actionLevel: z.enum(MHD_ATTENDANCE_ACTION_LEVELS),
        }),
      )
      .refine(
        (thresholds) => new Set(thresholds.map((t) => t.pointsAt)).size === thresholds.length,
        'Two thresholds cannot sit at the same point total.',
      )
      .refine((thresholds) => {
        // Escalation must not invert: a more severe action cannot sit at a lower
        // point total than a less severe one, or the ladder reads backwards to
        // anyone auditing the policy.
        const severity = MHD_ATTENDANCE_ACTION_LEVELS as readonly string[];
        const ordered = [...thresholds].sort((a, b) => a.pointsAt - b.pointsAt);
        return ordered.every(
          (threshold, index) =>
            index === 0 ||
            severity.indexOf(threshold.actionLevel) >=
              severity.indexOf(ordered[index - 1]!.actionLevel),
        );
      }, 'Escalation is inverted — a more severe action sits below a less severe one.'),
  })
  .refine((form) => form.pointRules.some((rule) => rule.points > 0), {
    message: 'At least one occurrence type must carry points, or nothing will ever accrue.',
    path: ['pointRules'],
  });

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdScheduleTemplateFormValues = z.infer<typeof mhdScheduleTemplateFormSchema>;
export type MhdScheduleAssignmentFormValues = z.infer<typeof mhdScheduleAssignmentSchema>;
export type MhdOverrideShiftFormValues = z.infer<typeof mhdOverrideShiftSchema>;
export type MhdCompanyHolidayFormValues = z.infer<typeof mhdCompanyHolidaySchema>;
export type MhdOccurrenceFormValues = z.infer<typeof mhdOccurrenceFormSchema>;
export type MhdReclassifyOccurrenceFormValues = z.infer<typeof mhdReclassifyOccurrenceSchema>;
export type MhdAdjustPointsFormValues = z.infer<typeof mhdAdjustPointsSchema>;
export type MhdResolveThresholdEventFormValues = z.infer<typeof mhdResolveThresholdEventSchema>;
export type MhdAttendancePolicyFormValues = z.infer<typeof mhdAttendancePolicySchema>;
export type MhdResolveReassessmentFormValues = z.infer<typeof mhdResolveReassessmentSchema>;
