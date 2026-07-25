import { z } from 'zod';

const prohibitedMedicalDetail =
  /\b(diagnos(?:is|ed|es)|medical records?|caused by|genetic information)\b/i;

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
