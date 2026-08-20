import { z } from 'zod';
import {
  MHD_LEAVE_CASE_STATUSES,
  MHD_LEAVE_CERTIFICATION_TYPES,
  MHD_LEAVE_JURISDICTIONS,
  MHD_LEAVE_MEASUREMENT_METHODS,
} from './Types';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');

// ---------------------------------------------------------------------------
// Leave types (0185 Studio)
// ---------------------------------------------------------------------------

/**
 * One combined schema for BOTH creating and editing a leave type — the same
 * shape `MhdLeaveTypeForm` mirrors from `MhdTrainingCourseForm`'s
 * create-or-edit pattern. On edit, `typeKey`/`jurisdiction`/`isGlobal` are
 * rendered read-only (the RPCs don't accept them for an update — see
 * `MhdUpdateLeaveTypeInput`) but stay in the schema so one `useForm` instance
 * and one submit handler cover both modes.
 *
 * `entitlementHours` and `measurementMonths` follow the training module's
 * blank-means-null convention (`z.preprocess`): an empty field is a
 * deliberate "no fixed cap" / "no window," never a coerced zero.
 */
export const mhdLeaveTypeFormSchema = z.object({
  typeId: z.string().trim().optional(),
  isGlobal: z.boolean().default(false),
  companyId: z.string().trim().min(1, 'Company is required.'),
  typeKey: z
    .string()
    .trim()
    .min(1, 'A type key is required.')
    .max(100, 'That type key is longer than the record supports.'),
  typeName: z.string().trim().min(1, 'A name is required.').max(200),
  jurisdiction: z.enum(MHD_LEAVE_JURISDICTIONS),
  entitlementHours: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number()
      .nonnegative('Entitlement hours cannot be negative.')
      .max(99999, 'That entitlement is out of range.')
      .nullable(),
  ),
  measurementMethod: z.enum(MHD_LEAVE_MEASUREMENT_METHODS),
  measurementMonths: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number()
      .int('Months must be a whole number.')
      .positive('Months must be greater than zero.')
      .nullable(),
  ),
  requiresCertification: z.boolean().default(false),
  citation: z.string().trim().max(500).optional().nullable(),
});

export type MhdLeaveTypeFormValues = z.infer<typeof mhdLeaveTypeFormSchema>;

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

/**
 * Opening a leave case. The date-range refinement mirrors the database CHECK
 * `leave_cases_range` (requested_end >= requested_start) so a reversed range is
 * a field message rather than a save failure. The server remains the authority.
 */
export const mhdLeaveCaseFormSchema = z
  .object({
    companyId: z.string().trim().min(1, 'Company is required.'),
    personId: z.string().trim().min(1, 'Employee is required.'),
    reasonCategory: z.string().trim().min(1, 'A reason category is required.').max(200),
    requestedStart: isoDate.optional().nullable(),
    requestedEnd: isoDate.optional().nullable(),
    isIntermittent: z.boolean().default(false),
  })
  .refine(
    (form) =>
      !form.requestedStart || !form.requestedEnd || form.requestedEnd >= form.requestedStart,
    {
      message: 'The end date must be on or after the start date.',
      path: ['requestedEnd'],
    },
  );

/**
 * Self-service leave request — the same reason/date/intermittent fields as
 * mhdLeaveCaseFormSchema above, but deliberately WITHOUT companyId/personId:
 * mhd_leave_case_create_self derives both server-side from the caller's own
 * linked person, so there is nothing here for a client to misdirect.
 */
export const mhdLeaveCaseSelfFormSchema = z
  .object({
    reasonCategory: z.string().trim().min(1, 'A reason category is required.').max(200),
    requestedStart: isoDate.optional().nullable(),
    requestedEnd: isoDate.optional().nullable(),
    isIntermittent: z.boolean().default(false),
  })
  .refine(
    (form) =>
      !form.requestedStart || !form.requestedEnd || form.requestedEnd >= form.requestedStart,
    {
      message: 'The end date must be on or after the start date.',
      path: ['requestedEnd'],
    },
  );

/**
 * The designation set. An empty array is permitted here — the RPC treats it as
 * "clear the set" — but `mhd_leave_designate` then refuses to decrement a case
 * with no bases, so the detail UI keeps a "designate hours" action disabled
 * until at least one basis is chosen.
 */
export const mhdSetLeaveCaseBasesSchema = z.object({
  caseId: z.string().trim().min(1),
  leaveTypeIds: z.array(z.string().trim().min(1)),
});

/**
 * A status transition. Denial and cancellation require a reason — an
 * unexplained denied leave is indefensible, the same rule the RPC enforces
 * (`leave_cases_decision_reason` CHECK plus the explicit guard in
 * `mhd_leave_case_transition`).
 */
export const mhdTransitionLeaveCaseSchema = z
  .object({
    caseId: z.string().trim().min(1),
    newStatus: z.enum(MHD_LEAVE_CASE_STATUSES),
    decisionReason: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (form) =>
      (form.newStatus !== 'DENIED' && form.newStatus !== 'CANCELLED') ||
      Boolean(form.decisionReason && form.decisionReason.trim().length > 0),
    {
      message: 'Denying or cancelling a leave requires a recorded reason.',
      path: ['decisionReason'],
    },
  );

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

/**
 * Designating hours against the case's basis set. The positivity rule mirrors
 * the RPC guard (`Designated hours must be positive`); the sign is applied
 * server-side (a designation is stored negative), so the form always collects a
 * positive magnitude.
 */
export const mhdDesignateLeaveSchema = z.object({
  caseId: z.string().trim().min(1),
  hours: z
    .number({ error: 'Enter a number of hours.' })
    .positive('Designated hours must be positive.')
    .max(9999, 'That is more hours than any single designation should carry.'),
  effectiveDate: isoDate,
});

/**
 * A manual adjustment to one basis's ledger. The reason is required — the RPC
 * refuses an adjustment without one (`leaves_ledger_reason_required` CHECK), and
 * an unexplained balance change is worthless as evidence in an FMLA dispute. The
 * delta is signed and must be non-zero.
 */
export const mhdAdjustLeaveSchema = z.object({
  personId: z.string().trim().min(1, 'Employee is required.'),
  leaveTypeId: z.string().trim().min(1, 'A legal basis is required.'),
  hoursDelta: z
    .number({ error: 'Enter a number of hours.' })
    .refine((value) => value !== 0, 'An adjustment must be non-zero.')
    .refine((value) => Math.abs(value) <= 9999, 'Adjustment is out of range.'),
  reason: z.string().trim().min(1, 'A manual adjustment requires a reason.').max(2000),
  effectiveDate: isoDate.optional().nullable(),
});

// ---------------------------------------------------------------------------
// Certifications — behind the medical gate
// ---------------------------------------------------------------------------

/**
 * Recording that a certification is required/received. Only ever reached by a
 * PA/HRP caller (the RPC re-checks `mhd_leaves_can_see_medical`), so this form
 * is rendered only when `canSeeMedical` is true.
 */
export const mhdRecordCertificationSchema = z.object({
  caseId: z.string().trim().min(1),
  certificationType: z.enum(MHD_LEAVE_CERTIFICATION_TYPES),
  dueDate: isoDate.optional().nullable(),
});

/**
 * Reviewing a certification's sufficiency. `providerNote` is restricted medical
 * detail that never leaves the certifications table; it is optional here and
 * only ever submitted by a PA/HRP caller.
 */
export const mhdMarkCertificationSchema = z.object({
  certId: z.string().trim().min(1),
  sufficient: z.boolean(),
  receivedAt: isoDate.optional().nullable(),
  providerNote: z.string().max(2000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdLeaveCaseFormValues = z.infer<typeof mhdLeaveCaseFormSchema>;
export type MhdLeaveCaseSelfFormValues = z.infer<typeof mhdLeaveCaseSelfFormSchema>;
export type MhdSetLeaveCaseBasesFormValues = z.infer<typeof mhdSetLeaveCaseBasesSchema>;
export type MhdTransitionLeaveCaseFormValues = z.infer<typeof mhdTransitionLeaveCaseSchema>;
export type MhdDesignateLeaveFormValues = z.infer<typeof mhdDesignateLeaveSchema>;
export type MhdAdjustLeaveFormValues = z.infer<typeof mhdAdjustLeaveSchema>;
export type MhdRecordCertificationFormValues = z.infer<typeof mhdRecordCertificationSchema>;
export type MhdMarkCertificationFormValues = z.infer<typeof mhdMarkCertificationSchema>;
