import { z } from 'zod';
import {
  MHD_CONDUCT_ACTION_OUTCOMES,
  MHD_CONDUCT_CASE_STATUSES,
  MHD_CONDUCT_CATEGORIES,
  MHD_CONDUCT_SEVERITIES,
} from './Types';

const mhdOptionalPayloadText = z.string().max(10000).optional().nullable();

export const mhdConductActionDocumentPayloadSchema = z
  .object({
    companyName: mhdOptionalPayloadText,
    positionTitle: mhdOptionalPayloadText,
    departmentProgram: mhdOptionalPayloadText,
    supervisorName: mhdOptionalPayloadText,
    facilityLocation: mhdOptionalPayloadText,
    dateOfHire: mhdOptionalPayloadText,
    dateOfNotice: mhdOptionalPayloadText,
    incidentDates: mhdOptionalPayloadText,
    incidentTime: mhdOptionalPayloadText,
    incidentLocation: mhdOptionalPayloadText,
    policiesViolated: mhdOptionalPayloadText,
    previouslyAddressed: mhdOptionalPayloadText,
    incidentNarrative: mhdOptionalPayloadText,
    incidentFindings: mhdOptionalPayloadText,
    policyCitationText: mhdOptionalPayloadText,
    priorCorrectiveActionSummary: mhdOptionalPayloadText,
    trainingItems: mhdOptionalPayloadText,
    trainingDeadline: mhdOptionalPayloadText,
    followUpReviewDate: mhdOptionalPayloadText,
    expectations: mhdOptionalPayloadText,
    consequencesText: mhdOptionalPayloadText,
    extenuatingCircumstancesConsidered: mhdOptionalPayloadText,
    extenuatingCircumstancesExplanation: mhdOptionalPayloadText,
  })
  .optional()
  .nullable();

/** Create form: subject, category, and the (sensitive) concern narrative. */
export const mhdConductCaseFormSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  personId: z.string().trim().min(1, 'Subject employee is required.'),
  category: z.enum(MHD_CONDUCT_CATEGORIES),
  concernSummary: z.string().max(10000).optional().nullable(),
});

/**
 * Lifecycle transition input. RESCINDED (a discipline decision reversed)
 * requires a non-blank reason — the CHECK constraint mirrors this
 * (`status <> 'RESCINDED' or rescind_reason present`). The CLOSED gate (every
 * action terminal) is server-side state, not form input — the RPC enforces it.
 */
export const mhdConductCaseTransitionSchema = z
  .object({
    newStatus: z.enum(MHD_CONDUCT_CASE_STATUSES),
    rescindReason: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (input) =>
      input.newStatus !== 'RESCINDED' ||
      Boolean(input.rescindReason && input.rescindReason.trim().length > 0),
    {
      message: 'A reason is required to rescind a conduct case.',
      path: ['rescindReason'],
    },
  );

/**
 * Corrective-action create/edit form (content fields; issuance and outcome move
 * through their own RPCs). A draft edits freely; the RPC refuses edits once the
 * action is ISSUED — the immutability trigger is the ultimate gate.
 */
export const mhdConductActionFormSchema = z.object({
  severity: z.enum(MHD_CONDUCT_SEVERITIES),
  actionSummary: z.string().max(10000).optional().nullable(),
  documentPayload: mhdConductActionDocumentPayloadSchema,
  requiresDocument: z.boolean().default(true),
});

/**
 * Terminal-outcome dialog (acknowledged / refused / waived). Mirrors the CHECK
 * constraints: REFUSED and WAIVED each require a non-blank reason; refusal also
 * accepts an optional witness. ACKNOWLEDGED carries no reason — and the RPC
 * gates it on the signature request completing, so it is never a free choice
 * while the document is unsigned.
 */
export const mhdConductOutcomeSchema = z
  .object({
    outcome: z.enum(MHD_CONDUCT_ACTION_OUTCOMES),
    reason: z.string().max(2000).optional().nullable(),
    witnessUserId: z.string().optional().nullable(),
  })
  .refine(
    (input) =>
      (input.outcome !== 'REFUSED' && input.outcome !== 'WAIVED') ||
      Boolean(input.reason && input.reason.trim().length > 0),
    {
      message: 'A reason is required to record a refusal or a waiver.',
      path: ['reason'],
    },
  );

export const mhdConductCaseFilterSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  personId: z.string().default('ALL'),
  category: z.union([z.enum(MHD_CONDUCT_CATEGORIES), z.literal('ALL')]).default('ALL'),
  status: z.union([z.enum(MHD_CONDUCT_CASE_STATUSES), z.literal('ALL')]).default('ALL'),
  searchTerm: z.string().default(''),
});

export type MhdConductCaseFormSchemaInput = z.infer<typeof mhdConductCaseFormSchema>;
export type MhdConductCaseTransitionSchemaInput = z.infer<typeof mhdConductCaseTransitionSchema>;
export type MhdConductActionFormSchemaInput = z.infer<typeof mhdConductActionFormSchema>;
export type MhdConductOutcomeSchemaInput = z.infer<typeof mhdConductOutcomeSchema>;
export type MhdConductCaseFilterSchemaInput = z.infer<typeof mhdConductCaseFilterSchema>;
