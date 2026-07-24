import { z } from 'zod';
import {
  MHD_MILEAGE_CLAIM_DECISIONS,
  MHD_MILEAGE_RATE_CATEGORIES,
  MHD_MILEAGE_RATE_MODES,
} from './Types';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');

/** Today in the same YYYY-MM-DD shape the RPCs take, for the not-in-the-future rule. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// NO STATUTORY FIGURE APPEARS AS A BOUND ANYWHERE IN THIS FILE. The only limits
// placed on a rate are sign and gross sanity, which are facts about arithmetic
// rather than about tax law. A bound derived from a published IRS figure would
// silently reject the next revision that moved past it.

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

/**
 * THE module invariant, mirrored client-side.
 *
 * Each refinement below matches a database CHECK on `mileage_trips`
 * (`_miles_positive`, `_not_future`, `_purpose_not_blank`, `_commuting_affirmed`,
 * `_commute_deduction`, `_odometer_nonneg`). Mirroring them turns a constraint
 * violation into a field-level message instead of a save failure.
 *
 * These checks exist for the message, not the enforcement. The server remains
 * the authority; a client that skipped validation entirely would still be
 * refused.
 */
export const mhdTripFormSchema = z
  .object({
    personId: z.string().trim().min(1, 'Employee is required.'),
    tripDate: isoDate,
    miles: z
      .number()
      .positive('Miles must be above zero.')
      .max(10_000, 'That mileage is not plausible for one trip.'),
    origin: z.string().trim().min(1, 'A starting point is required.').max(500),
    destination: z.string().trim().min(1, 'A destination is required.').max(500),
    // Rule 6. This is the substantiation field: a mileage log full of blanks is
    // worth nothing in an audit, which is why it is required rather than
    // encouraged.
    businessPurpose: z
      .string()
      .trim()
      .min(
        1,
        'A business purpose is required — it is what substantiates the trip if the log is ever examined.',
      )
      .max(2000),
    notOrdinaryCommuting: z.boolean(),
    isRoundTrip: z.boolean().default(false),
    odometerStart: z
      .number()
      .min(0, 'An odometer reading cannot be negative.')
      .optional()
      .nullable(),
    odometerEnd: z.number().min(0, 'An odometer reading cannot be negative.').optional().nullable(),
    commuteDeductionMiles: z
      .number()
      .min(0, 'A commute deduction cannot be negative.')
      .optional()
      .nullable(),
    vehicleDescription: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((form) => form.tripDate <= today(), {
    message: 'A trip cannot be logged before it has happened.',
    path: ['tripDate'],
  })
  // Ordinary commuting mileage is not reimbursable. The affirmation is not a
  // checkbox that may be left false — the RPC refuses the trip outright — so it
  // is presented as a statement the recorder makes, not a preference they set.
  .refine((form) => form.notOrdinaryCommuting, {
    message:
      'Confirm this was not ordinary commuting. Commuting mileage is not reimbursable and the trip cannot be recorded without the affirmation.',
    path: ['notOrdinaryCommuting'],
  })
  // A deduction equal to or larger than the trip leaves nothing to reimburse,
  // which is a mis-entry rather than a claim of zero.
  .refine((form) => form.commuteDeductionMiles == null || form.commuteDeductionMiles < form.miles, {
    message: 'The commute deduction must be smaller than the trip itself.',
    path: ['commuteDeductionMiles'],
  })
  .refine(
    (form) =>
      form.odometerStart == null ||
      form.odometerEnd == null ||
      form.odometerEnd >= form.odometerStart,
    {
      message: 'The closing odometer reading cannot be below the opening one.',
      path: ['odometerEnd'],
    },
  );
// Note: there is deliberately NO rule tying the odometer readings to `miles`.
// The two disagree honestly more often than not — one leg of a round trip, an
// unrecorded detour, a start-of-day reading — and a form that rejects the truth
// teaches people to adjust the odometer until it passes, turning an imprecise
// honest record into a precise fabricated one. The database omits the
// constraint for the same reason; do not add it here.

export const mhdVoidTripSchema = z.object({
  tripId: z.string().trim().min(1),
  reason: z.string().trim().min(1, 'A reason is required to void a trip.').max(2000),
});

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export const mhdClaimPeriodSchema = z
  .object({
    personId: z.string().trim().min(1, 'Employee is required.'),
    periodStart: isoDate,
    periodEnd: isoDate,
  })
  .refine((form) => form.periodEnd >= form.periodStart, {
    message: 'The period must end on or after it starts.',
    path: ['periodEnd'],
  })
  // Only trips inside the period can be added to the claim, so a period that
  // ends before any trip could have happened is an empty claim by construction.
  .refine((form) => form.periodStart <= today(), {
    message: 'A claim period cannot start in the future.',
    path: ['periodStart'],
  });

/**
 * The decision. A reason is required on REJECTED and optional on APPROVED —
 * the asymmetry is the database's (`mileage_claims_reject_note`) and it is
 * deliberate: a rejection is an adverse decision the claimant is entitled to
 * understand, and one with no recorded reason cannot be told apart from an
 * oversight.
 */
export const mhdClaimDecisionSchema = z
  .object({
    claimId: z.string().trim().min(1),
    decision: z.enum(MHD_MILEAGE_CLAIM_DECISIONS),
    decisionNote: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (form) =>
      form.decision !== 'REJECTED' ||
      Boolean(form.decisionNote && form.decisionNote.trim().length > 0),
    {
      message:
        'A rejected claim requires a reason — it is what the claimant is owed and what the record has to show.',
      path: ['decisionNote'],
    },
  );

export const mhdMarkClaimExportedSchema = z.object({
  claimId: z.string().trim().min(1),
  batchReference: z
    .string()
    .trim()
    .min(1, 'A batch reference is required — it is the tie between this claim and the payment run.')
    .max(200),
});

// ---------------------------------------------------------------------------
// Rate registry (Platform Admin)
// ---------------------------------------------------------------------------

/**
 * Proposing a registry row. Rule 3: a rate without its citation is a number
 * somebody typed, which is exactly what the registry exists to prevent. Both
 * the source URL and the notice number are required here, at proposal, rather
 * than at confirmation — the confirmer needs something to check the figure
 * against, and `mhd_mileage_confirm_rate` refuses a row that lacks either.
 *
 * The published pages contradict each other and mid-year revisions are not
 * rare, so the notice number is the only stable identity a figure has.
 */
export const mhdRateProposalSchema = z.object({
  category: z.enum(MHD_MILEAGE_RATE_CATEGORIES),
  ratePerMile: z
    .number()
    .positive('A rate must be above zero.')
    // Sanity only, not a statutory bound: a rate per MILE in the tens of
    // dollars is a decimal-point slip, most often cents entered as dollars.
    .max(100, 'That looks like a cents-versus-dollars slip — enter the rate per mile.'),
  effectiveFrom: isoDate,
  sourceUrl: z
    .string()
    .trim()
    .min(1, 'A source URL is required — the row is the documentation of the decision.')
    .url('Enter the full URL of the page or document the figure came from.')
    .max(1000),
  noticeNumber: z
    .string()
    .trim()
    .min(
      1,
      'A notice or bulletin number is required to identify which publication this figure came from.',
    )
    .max(100),
  sourceDocumentDate: isoDate.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Company rate policy
// ---------------------------------------------------------------------------

/**
 * What the company chooses to pay, versioned by effective date.
 *
 * The mode/rate pairing is enforced in BOTH directions, matching
 * `mileage_policies_fixed_shape`: a FIXED policy without a rate is unusable, and
 * a tracking policy carrying one invites the reader to believe the wrong number
 * applies. Neither shape is a warning — both are refused.
 *
 * Paying above the IRS business rate is lawful, and this schema does not block
 * it. The excess is reportable wages; the editor states that consequence
 * instead, because the system's job is to make it visible and computable rather
 * than to overrule a business decision.
 */
export const mhdCompanyRatePolicySchema = z
  .object({
    companyId: z.string().trim().min(1),
    effectiveFrom: isoDate,
    rateMode: z.enum(MHD_MILEAGE_RATE_MODES),
    fixedRatePerMile: z
      .number()
      .positive('A fixed rate must be above zero.')
      .max(100, 'That looks like a cents-versus-dollars slip — enter the rate per mile.')
      .optional()
      .nullable(),
    policyNote: z.string().max(2000).optional().nullable(),
  })
  .refine((form) => form.rateMode !== 'FIXED' || form.fixedRatePerMile != null, {
    message: 'A fixed policy needs the rate it pays.',
    path: ['fixedRatePerMile'],
  })
  .refine((form) => form.rateMode !== 'TRACK_IRS_BUSINESS' || form.fixedRatePerMile == null, {
    message:
      'A policy that tracks the IRS rate must not also carry a fixed rate — only one of them can be the number that applies.',
    path: ['fixedRatePerMile'],
  });

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdTripFormValues = z.infer<typeof mhdTripFormSchema>;
export type MhdVoidTripFormValues = z.infer<typeof mhdVoidTripSchema>;
export type MhdClaimPeriodFormValues = z.infer<typeof mhdClaimPeriodSchema>;
export type MhdClaimDecisionFormValues = z.infer<typeof mhdClaimDecisionSchema>;
export type MhdMarkClaimExportedFormValues = z.infer<typeof mhdMarkClaimExportedSchema>;
export type MhdRateProposalFormValues = z.infer<typeof mhdRateProposalSchema>;
export type MhdCompanyRatePolicyFormValues = z.infer<typeof mhdCompanyRatePolicySchema>;
