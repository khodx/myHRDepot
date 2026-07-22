import { z } from 'zod';
import {
  MHD_INVESTIGATION_CASE_TYPES,
  MHD_INVESTIGATION_CONFIDENTIALITIES,
  MHD_INVESTIGATION_DISPOSITIONS,
  MHD_INVESTIGATION_PARTY_ROLES,
  MHD_INVESTIGATION_STATUSES,
} from './Types';

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

/**
 * Opening an investigation. The allegation is REQUIRED — an investigation with
 * no allegation is not a record of anything — and it is the field encrypted at
 * rest (`mhd_encrypt_field_value` on create). Confidentiality defaults to
 * STANDARD, matching the column default. The server remains the authority on who
 * may open a case (privileged set); this schema only validates the payload.
 */
export const mhdInvestigationCaseFormSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  caseType: z.enum(MHD_INVESTIGATION_CASE_TYPES),
  allegation: z
    .string()
    .trim()
    .min(1, 'An allegation is required to open a case.')
    .max(20000, 'That allegation is longer than the record supports.'),
  assignedInvestigator: z.string().trim().optional().nullable(),
  severity: z.string().trim().max(200).optional().nullable(),
  confidentiality: z.enum(MHD_INVESTIGATION_CONFIDENTIALITIES).default('STANDARD'),
});

/**
 * A lifecycle transition. Closing requires a disposition — the RPC raises
 * `Closing an investigation requires a disposition` otherwise — so the refinement
 * mirrors that guard, turning a would-be save failure into a field message. A
 * disposition on a non-close transition is allowed (it may be recorded early).
 */
export const mhdTransitionInvestigationSchema = z
  .object({
    caseId: z.string().trim().min(1),
    newStatus: z.enum(MHD_INVESTIGATION_STATUSES),
    disposition: z.enum(MHD_INVESTIGATION_DISPOSITIONS).optional().nullable(),
    finding: z.string().max(20000).optional().nullable(),
  })
  .refine((form) => form.newStatus !== 'CLOSED' || Boolean(form.disposition), {
    message: 'Closing an investigation requires a disposition.',
    path: ['disposition'],
  });

// ---------------------------------------------------------------------------
// Parties
// ---------------------------------------------------------------------------

/**
 * Adding a party. Both `personId` and `externalName` are optional and nullable —
 * anonymous intake is first-class, so a party with neither a linked person nor an
 * external name is valid (a hotline complaint with no named source). The
 * statement, if given, is encrypted at rest server-side.
 */
export const mhdAddPartySchema = z.object({
  caseId: z.string().trim().min(1),
  partyRole: z.enum(MHD_INVESTIGATION_PARTY_ROLES),
  personId: z.string().trim().optional().nullable(),
  externalName: z.string().trim().max(200).optional().nullable(),
  isConfidential: z.boolean().default(false),
  statement: z.string().max(20000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------

/**
 * Granting access to a user. There is deliberately NO role field — the RPC
 * requires the caller to already be a grant-holder (access to grant access is
 * access), so the only input is who to let in.
 */
export const mhdInvestigationGrantSchema = z.object({
  caseId: z.string().trim().min(1),
  userId: z.string().trim().min(1, 'Choose a user to grant access to.'),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdInvestigationCaseFormValues = z.infer<typeof mhdInvestigationCaseFormSchema>;
export type MhdTransitionInvestigationFormValues = z.infer<typeof mhdTransitionInvestigationSchema>;
export type MhdAddPartyFormValues = z.infer<typeof mhdAddPartySchema>;
export type MhdInvestigationGrantFormValues = z.infer<typeof mhdInvestigationGrantSchema>;
