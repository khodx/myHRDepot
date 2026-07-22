import { z } from 'zod';
import { MHD_HANDBOOK_JURISDICTIONS, MHD_HANDBOOK_TYPES } from './Types';

// ---------------------------------------------------------------------------
// Create handbook
// ---------------------------------------------------------------------------

/**
 * Creating a draft handbook — step one of the wizard. `handbookType` picks the
 * content pack (EMPLOYEE / SAFETY); `jurisdictions` drives assembly and must
 * carry at least one scope (the RPC raises `At least one jurisdiction is required`
 * otherwise, so the refinement turns a would-be save failure into a field
 * message). This schema validates the payload only; the server remains the
 * authority on who may create a handbook and refuses a non-admin.
 *
 * zod v4: enum options carry no `errorMap` — a bad enum value simply fails the
 * enum check; the `handbookType` select only ever emits the two valid values, so
 * the field message would not surface in practice anyway. Matches the leaves /
 * training idioms.
 */
export const mhdCreateHandbookSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  handbookType: z.enum(MHD_HANDBOOK_TYPES),
  title: z
    .string()
    .trim()
    .min(1, 'A title is required.')
    .max(300, 'That title is longer than the record supports.'),
  jurisdictions: z
    .array(z.enum(MHD_HANDBOOK_JURISDICTIONS))
    .min(1, 'Choose at least one jurisdiction.'),
});

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

/**
 * Publishing a draft. `effectiveDate` is optional (a handbook may be published
 * without a stated effective date). `documentGenerationId` is the app-layer
 * doc-gen soft link — not entered on a form, it is injected by the host route,
 * so it is optional here and simply forwarded when present.
 */
export const mhdPublishHandbookSchema = z.object({
  handbookId: z.string().trim().min(1),
  effectiveDate: z.string().trim().optional().nullable(),
  documentGenerationId: z.string().trim().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Assign acknowledgment
// ---------------------------------------------------------------------------

/**
 * Assigning an acknowledgment of a published version to a person. `versionId`
 * points at a specific FROZEN version (never the live library). The e-sign
 * request id is the app-layer soft link, injected by the host route — optional
 * here and forwarded when present.
 */
export const mhdAssignAcknowledgmentSchema = z.object({
  versionId: z.string().trim().min(1, 'A version is required.'),
  personId: z.string().trim().min(1, 'Choose a person to assign it to.'),
  esignatureRequestId: z.string().trim().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdCreateHandbookFormValues = z.infer<typeof mhdCreateHandbookSchema>;
export type MhdPublishHandbookFormValues = z.infer<typeof mhdPublishHandbookSchema>;
export type MhdAssignAcknowledgmentFormValues = z.infer<typeof mhdAssignAcknowledgmentSchema>;
