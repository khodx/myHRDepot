import { z } from 'zod';
import {
  MHD_ACCOMMODATION_CERTIFICATION_METHODS,
  MHD_ACCOMMODATION_DENIAL_REASON_RULES,
  MHD_ACCOMMODATION_DENIAL_REASONS,
  MHD_ACCOMMODATION_LIMITATION_DURATIONS,
  MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS,
  MHD_ACCOMMODATION_REVIEW_OUTCOMES_REQUIRING_REENGAGEMENT,
} from './Types';

/**
 * Mirrors mhd_text_has_prohibited_medical_detail (migration 0387), the single server-side screen:
 * diagnosis, medical records, causation, and genetic information (tests, data, family history, DNA).
 * The database stays the authority; this lets the form say so before a round trip.
 */
export const prohibitedMedicalDetail =
  /\b(diagnos(?:is|ed|es)|medical records?|caused by|genetic information|genetic (?:tests?|testing|screening|data|markers?)|genetics|genome|dna|family (?:medical )?history)\b/i;

const noMedicalDetail = (value: string) => !prohibitedMedicalDetail.test(value);
const PROHIBITED_MESSAGE =
  'Do not enter a diagnosis, causation statement, genetic information, or medical record.';

export const mhdAccommodationRequestSchema = z.object({
  personId: z.string().uuid('Choose a person.'),
  requestSource: z.enum([
    'SELF',
    'REPRESENTATIVE',
    'EMPLOYER_OBSERVED',
    'LEAVE_EXHAUSTION',
    'RETURN_TO_WORK',
    'APPLICANT',
    'OTHER',
  ]),
  requestChannel: z.enum(['VERBAL', 'WRITTEN', 'EMAIL', 'PHONE', 'PORTAL', 'OBSERVED', 'OTHER']),
  requestedAt: z.string().min(1),
  requestSummary: z
    .string()
    .trim()
    .min(1, 'Describe the workplace change or assistance requested.')
    .refine(
      (value) => !prohibitedMedicalDetail.test(value),
      'Do not enter a diagnosis, causation statement, genetic information, or medical record.',
    ),
});

export const mhdAccommodationInteractionSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => !prohibitedMedicalDetail.test(value),
      'Record the interactive process, functional needs, and next steps—not medical details.',
    ),
});

/**
 * Completing an effectiveness review. The summary reuses the interaction
 * summary rule (no medical detail; the DB also requires it non-blank when a
 * review is completed), and re-engagement is mandatory for outcomes showing the
 * accommodation is not working.
 */
export const mhdAccommodationReviewCompletionSchema = z
  .object({
    effectiveness: z.enum(MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS as [string, ...string[]]),
    summary: mhdAccommodationInteractionSchema.shape.summary,
    reengageRequired: z.boolean(),
  })
  .refine(
    (value) =>
      value.reengageRequired ||
      !(MHD_ACCOMMODATION_REVIEW_OUTCOMES_REQUIRING_REENGAGEMENT as readonly string[]).includes(
        value.effectiveness,
      ),
    {
      path: ['reengageRequired'],
      message:
        'A partially effective or ineffective accommodation must re-engage the interactive process.',
    },
  );

export const mhdAccommodationOptionSchema = z.object({
  description: z.string().trim().min(1),
  expectedEffectiveness: z.string().trim().min(1),
});

/**
 * The restricted medical record — the ONLY place medical text is accepted, and
 * even here it is confined to two facts: what the person cannot currently do
 * (functional limitation) and what change would help (accommodation need).
 *
 * Two rules are enforced here AND server-side, never only here:
 * - The prohibited-detail refinement rejects diagnosis, causation, medical
 *   records, and genetic information in either field.
 * - `need_is_obvious` and `documentationRequested` are mutually exclusive: when
 *   the disability and the need for accommodation are obvious, documentation
 *   cannot be requested at all (mirrored by the
 *   `accommodation_obvious_need_no_request` CHECK constraint, which raises
 *   23514).
 */
const medicalText = z
  .string()
  .trim()
  .refine(
    (value) => !prohibitedMedicalDetail.test(value),
    'Record only the functional limitation and the accommodation need. A diagnosis, cause, medical record, or genetic information must never be entered.',
  );

export const mhdAccommodationMedicalSchema = z
  .object({
    documentationType: z.enum([
      'SIMPLE_CERTIFICATION',
      'DETAILED_CERTIFICATION',
      'PROVIDER_NOTE',
      'EMPLOYEE_STATEMENT',
      'OTHER',
    ]),
    status: z.enum([
      'NOT_NEEDED',
      'REQUESTED',
      'RECEIVED',
      'INCOMPLETE',
      'SUFFICIENT',
      'EXPIRED',
      'WAIVED',
    ]),
    needIsObvious: z.boolean(),
    documentationRequested: z.boolean(),
    requestedAt: z.string().trim().optional().nullable(),
    dueDate: z.string().trim().optional().nullable(),
    receivedAt: z.string().trim().optional().nullable(),
    functionalLimitation: medicalText.optional().nullable(),
    accommodationNeed: medicalText.optional().nullable(),
  })
  .refine((value) => !(value.needIsObvious && value.documentationRequested), {
    path: ['documentationRequested'],
    message:
      'Medical documentation cannot be requested when the disability and the need for accommodation are obvious.',
  })
  .refine((value) => !value.documentationRequested || Boolean(value.requestedAt), {
    path: ['requestedAt'],
    message: 'Record the date documentation was requested.',
  });

export interface MhdAccommodationDecisionContext {
  outcome: 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED';
  selectedOptionId?: string | null;
  individualizedAnalysis?: string | null;
  interactionCount: number;
  optionCount: number;
  selectedOptionRemovesEssentialFunction?: boolean;
}

/**
 * The decision gate, as human-readable reasons. Every rule below is also
 * enforced by `mhd_accommodation_decide` (23514) — this exists so the operator
 * reads why the affordance is unavailable, and is never the enforcement:
 *
 * - The interactive process must have happened before a decision exists.
 * - At least one option must have been evaluated — a decision with nothing
 *   evaluated is not an individualized assessment.
 * - A grant must name the option being granted.
 * - An option that removes an essential function is not a reasonable
 *   accommodation and can never be the selected one.
 * - A denial requires an individualized analysis recording the alternatives
 *   that were evaluated.
 */
export function mhdAccommodationDecisionBlockers(
  context: MhdAccommodationDecisionContext,
): string[] {
  const blockers: string[] = [];
  if (context.interactionCount <= 0) {
    blockers.push('Record at least one interactive-process interaction before deciding.');
  }
  if (context.optionCount <= 0) {
    blockers.push('Evaluate at least one accommodation option before deciding.');
  }
  if (context.outcome !== 'DENIED' && !context.selectedOptionId) {
    blockers.push('Select the accommodation option being granted.');
  }
  if (context.selectedOptionRemovesEssentialFunction) {
    blockers.push('An option that removes an essential function cannot be selected.');
  }
  if (context.outcome === 'DENIED' && !context.individualizedAnalysis?.trim()) {
    blockers.push(
      'A denial requires an individualized analysis recording the alternatives that were evaluated.',
    );
  }
  return blockers;
}

export const mhdAccommodationDecisionSchema = z
  .object({
    outcome: z.enum(['APPROVED', 'PARTIALLY_APPROVED', 'DENIED']),
    decisionSummary: z.string().trim().min(1, 'Summarize the decision.'),
    selectedOptionId: z.string().trim().optional().nullable(),
    denialReasonCode: z.string().trim().optional().nullable(),
    individualizedAnalysis: z.string().trim().optional().nullable(),
    interactionCount: z.number().int(),
    optionCount: z.number().int(),
    selectedOptionRemovesEssentialFunction: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    for (const message of mhdAccommodationDecisionBlockers(value)) {
      ctx.addIssue({ code: 'custom', message });
    }
  });

export type MhdAccommodationRequestValues = z.infer<typeof mhdAccommodationRequestSchema>;
export type MhdAccommodationMedicalValues = z.infer<typeof mhdAccommodationMedicalSchema>;

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');

/** One denial reason with the specifics its code requires (Section D). */
export const mhdAccommodationDenialReasonSchema = z
  .object({
    code: z.enum(MHD_ACCOMMODATION_DENIAL_REASONS),
    detail: z.string().trim().optional().nullable(),
    alternativeOffered: z.string().trim().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const rule = MHD_ACCOMMODATION_DENIAL_REASON_RULES[value.code];
    if (rule.requiresDetail && !value.detail) {
      ctx.addIssue({
        code: 'custom',
        path: ['detail'],
        message: 'Describe the specifics for this reason.',
      });
    }
    if (rule.requiresAlternative && !value.alternativeOffered) {
      ctx.addIssue({
        code: 'custom',
        path: ['alternativeOffered'],
        message: 'Identify the accommodation that was offered.',
      });
    }
    for (const field of ['detail', 'alternativeOffered'] as const) {
      const text = value[field];
      if (text && !noMedicalDetail(text)) {
        ctx.addIssue({ code: 'custom', path: [field], message: PROHIBITED_MESSAGE });
      }
    }
  });

/** The set of reasons for a denied or partly denied decision: at least one, each once. */
export const mhdAccommodationDenialReasonsSchema = z
  .array(mhdAccommodationDenialReasonSchema)
  .min(1, 'Choose at least one reason.')
  .superRefine((reasons, ctx) => {
    const seen = new Set<string>();
    for (const reason of reasons) {
      if (seen.has(reason.code)) {
        ctx.addIssue({ code: 'custom', message: 'Each reason can be listed only once.' });
      }
      seen.add(reason.code);
    }
  });

/** Whether the chosen reasons require the interactive process to continue (undue hardship does not end it). */
export function mhdAccommodationReasonsRequireContinuation(
  reasons: ReadonlyArray<{ code: string }>,
): boolean {
  return reasons.some((reason) => reason.code === 'UNDUE_HARDSHIP');
}

/** Section A of the package. A recovery date fits only a temporary limitation. */
export const mhdAccommodationRequestDetailsSchema = z
  .object({
    caseId: z.string().uuid(),
    limitationDuration: z.enum(MHD_ACCOMMODATION_LIMITATION_DURATIONS).optional().nullable(),
    anticipatedRecoveryDate: isoDate.optional().nullable(),
    workersCompClaim: z.boolean().default(false),
    workersCompClaimFiledOn: isoDate.optional().nullable(),
    leaveRequested: z.boolean().default(false),
    leaveRequestDetails: z.string().trim().optional().nullable(),
    contactPhone: z.string().trim().optional().nullable(),
    contactEmail: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .optional()
      .nullable()
      .or(z.literal('')),
    workLocation: z.string().trim().optional().nullable(),
    supervisorName: z.string().trim().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.anticipatedRecoveryDate && value.limitationDuration !== 'TEMPORARY') {
      ctx.addIssue({
        code: 'custom',
        path: ['anticipatedRecoveryDate'],
        message: 'A recovery date applies only to a temporary limitation.',
      });
    }
    if (value.workersCompClaimFiledOn && !value.workersCompClaim) {
      ctx.addIssue({
        code: 'custom',
        path: ['workersCompClaimFiledOn'],
        message: "A date filed needs a workers' compensation claim.",
      });
    }
    if (value.leaveRequested && !value.leaveRequestDetails) {
      ctx.addIssue({
        code: 'custom',
        path: ['leaveRequestDetails'],
        message: 'Say what leave was requested and when.',
      });
    }
    for (const field of ['leaveRequestDetails', 'workLocation', 'supervisorName'] as const) {
      const text = value[field];
      if (text && !noMedicalDetail(text)) {
        ctx.addIssue({ code: 'custom', path: [field], message: PROHIBITED_MESSAGE });
      }
    }
  });

export const mhdAccommodationEmployeeCertifySchema = z.object({
  caseId: z.string().uuid(),
  method: z.enum(MHD_ACCOMMODATION_CERTIFICATION_METHODS).default('SELF_SERVICE'),
});

/** Section B: the provider's certification (medical roles only). */
export const mhdAccommodationProviderCertificationSchema = z
  .object({
    caseId: z.string().uuid(),
    providerName: z.string().trim().optional().nullable(),
    certifiedAt: isoDate.optional().nullable(),
    disabilityVerified: z.boolean().default(false),
    limitationDuration: z.enum(MHD_ACCOMMODATION_LIMITATION_DURATIONS).optional().nullable(),
    limitationEndDate: isoDate.optional().nullable(),
    accommodationBeginOn: isoDate.optional().nullable(),
    accommodationEndOn: isoDate.optional().nullable(),
    accommodationContinuous: z.boolean().default(false),
    recommendation: z.string().trim().optional().nullable(),
    jobDutyStatementSentAt: isoDate.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.limitationEndDate && value.limitationDuration !== 'TEMPORARY') {
      ctx.addIssue({
        code: 'custom',
        path: ['limitationEndDate'],
        message: 'An end date applies only to a temporary limitation.',
      });
    }
    if (
      value.accommodationBeginOn &&
      value.accommodationEndOn &&
      value.accommodationEndOn < value.accommodationBeginOn
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['accommodationEndOn'],
        message: 'The accommodation cannot end before it begins.',
      });
    }
    if (value.accommodationContinuous && value.accommodationEndOn) {
      ctx.addIssue({
        code: 'custom',
        path: ['accommodationEndOn'],
        message: 'A continuous accommodation has no end date.',
      });
    }
    if (value.certifiedAt && !value.providerName) {
      ctx.addIssue({
        code: 'custom',
        path: ['providerName'],
        message: "Enter the provider's name.",
      });
    }
    for (const field of ['providerName', 'recommendation'] as const) {
      const text = value[field];
      if (text && !noMedicalDetail(text)) {
        ctx.addIssue({ code: 'custom', path: [field], message: PROHIBITED_MESSAGE });
      }
    }
  });

/** Equipment ordered and received (Section D). Receipt needs an order date and cannot precede it. */
export const mhdAccommodationEquipmentSchema = z
  .object({
    implementationId: z.string().uuid(),
    orderedOn: isoDate.optional().nullable(),
    orderedBy: z.string().uuid().optional().nullable(),
    receivedOn: isoDate.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.orderedBy && !value.orderedOn) {
      ctx.addIssue({
        code: 'custom',
        path: ['orderedOn'],
        message: 'Enter the date the equipment was ordered.',
      });
    }
    if (value.receivedOn && !value.orderedOn) {
      ctx.addIssue({
        code: 'custom',
        path: ['receivedOn'],
        message: 'Equipment cannot be received before it is ordered.',
      });
    }
    if (value.receivedOn && value.orderedOn && value.receivedOn < value.orderedOn) {
      ctx.addIssue({
        code: 'custom',
        path: ['receivedOn'],
        message: 'Equipment cannot be received before it was ordered.',
      });
    }
  });
