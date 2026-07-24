import { z } from 'zod';
import {
  MHD_RECRUITING_EEO_DISABILITY_STATUSES,
  MHD_RECRUITING_EEO_GENDERS,
  MHD_RECRUITING_EEO_RACE_ETHNICITIES,
  MHD_RECRUITING_EEO_VETERAN_STATUSES,
  MHD_RECRUITING_STAGE_CATEGORIES,
} from './Types';

// ---------------------------------------------------------------------------
// Requisition
// ---------------------------------------------------------------------------

/**
 * Creating a requisition. `title` is required; `headcount` mirrors the column
 * CHECK (`>= 1`) and defaults to 1. Every other field is optional (a req may be
 * drafted before a JD, hiring manager, or location exists). `jobId` /
 * `hiringManagerPersonId` are ids chosen from pickers; blank means unset. This
 * schema validates the payload only; the RPC remains the authority on who may
 * create a requisition (the three admin roles).
 */
export const mhdRequisitionFormSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  title: z
    .string()
    .trim()
    .min(1, 'A title is required.')
    .max(300, 'That title is longer than the record supports.'),
  jobId: z.string().trim().optional().nullable().or(z.literal('')),
  hiringManagerPersonId: z.string().trim().optional().nullable().or(z.literal('')),
  department: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  location: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  employmentType: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  // The number input hands back a string; an empty field is a deliberate default
  // of 1, not zero. Preprocess maps '' / null / undefined to 1 before the
  // integer/positive checks so a blank field is a valid 1 rather than a coerced 0.
  headcount: z.preprocess(
    (value) => (value === '' || value == null ? 1 : value),
    z.coerce
      .number({ error: 'Enter a whole number of openings.' })
      .int('Headcount must be a whole number.')
      .min(1, 'Headcount must be at least 1.'),
  ),
  requiresApproval: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Pipeline stage config
// ---------------------------------------------------------------------------

/**
 * Authoring a company pipeline stage. `stageKey` is the stable per-scope
 * identifier; `category` drives the lifecycle a moved application takes and
 * defaults to `ACTIVE`. `sortOrder` positions the column on the board.
 */
export const mhdStageUpsertSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  stageKey: z
    .string()
    .trim()
    .min(1, 'A stage key is required.')
    .max(120, 'That stage key is longer than the record supports.'),
  stageName: z
    .string()
    .trim()
    .min(1, 'A stage name is required.')
    .max(200, 'That stage name is longer than the record supports.'),
  category: z.enum(MHD_RECRUITING_STAGE_CATEGORIES, {
    error: 'Choose a category.',
  }),
  sortOrder: z.preprocess(
    (value) => (value === '' || value == null ? 100 : value),
    z.coerce.number({ error: 'Enter a whole number.' }).int().min(0),
  ),
});

// ---------------------------------------------------------------------------
// Invite
// ---------------------------------------------------------------------------

/**
 * Inviting a person to apply. `personId` is chosen from the People picker (an
 * applicant is a PERSON — no candidates table). `source` is optional free text
 * (referral / job board / etc.). The one-application-per-person-per-req guard is
 * a server invariant (unique index); a duplicate raises and its error surfaces.
 */
export const mhdInviteApplicationSchema = z.object({
  requisitionId: z.string().trim().min(1),
  personId: z.string().trim().min(1, 'Choose a person to invite.'),
  source: z.string().trim().max(200).optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Rejection (inline dialog — reason picker, never window.prompt)
// ---------------------------------------------------------------------------

/**
 * Rejecting an application. A reason (from `reason_list`) is optional at the RPC,
 * but the dialog encourages one; a free-text note is optional. First-class
 * terminal outcome — independent of moving to a REJECTED stage.
 */
export const mhdRejectApplicationSchema = z.object({
  applicationId: z.string().trim().min(1),
  reasonId: z.string().trim().optional().nullable().or(z.literal('')),
  note: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Public apply form (tokenized, unauthenticated)
// ---------------------------------------------------------------------------

/**
 * The applicant's structured fields, submitted UNAUTHENTICATED through the apply
 * link. Every field is optional — mirrors `onboarding_employment_applications`.
 * `desiredPayRate` is the numeric; a blank field is unset (null), not zero, so
 * preprocess maps '' / null to null before the positive check.
 */
export const mhdApplySchema = z.object({
  desiredPayRate: z.preprocess(
    (value) => (value === '' || value == null ? null : value),
    z.coerce
      .number({ error: 'Enter a pay rate as a number.' })
      .positive('Pay rate must be greater than zero.')
      .nullable(),
  ),
  availabilityDate: z.string().trim().optional().nullable().or(z.literal('')),
  employmentTypeDesired: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  coverNote: z.string().trim().max(4000).optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Public EEO self-identification (voluntary, tokenized)
// ---------------------------------------------------------------------------

/**
 * The applicant's VOLUNTARY EEO self-id, submitted through the same link. Every
 * field is optional; `declined` records an explicit decline-to-state. The values
 * write ONLY to the hard-restricted partition and are never read back onto a
 * recruiter surface — the schema just shapes the voluntary form.
 */
export const mhdEeoSelfIdSchema = z.object({
  raceEthnicity: z
    .enum(MHD_RECRUITING_EEO_RACE_ETHNICITIES)
    .optional()
    .nullable()
    .or(z.literal('')),
  gender: z.enum(MHD_RECRUITING_EEO_GENDERS).optional().nullable().or(z.literal('')),
  veteranStatus: z
    .enum(MHD_RECRUITING_EEO_VETERAN_STATUSES)
    .optional()
    .nullable()
    .or(z.literal('')),
  disabilityStatus: z
    .enum(MHD_RECRUITING_EEO_DISABILITY_STATUSES)
    .optional()
    .nullable()
    .or(z.literal('')),
  declined: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdRequisitionFormValues = z.infer<typeof mhdRequisitionFormSchema>;
export type MhdStageUpsertFormValues = z.infer<typeof mhdStageUpsertSchema>;
export type MhdInviteApplicationFormValues = z.infer<typeof mhdInviteApplicationSchema>;
export type MhdRejectApplicationFormValues = z.infer<typeof mhdRejectApplicationSchema>;
export type MhdApplyFormValues = z.infer<typeof mhdApplySchema>;
export type MhdEeoSelfIdFormValues = z.infer<typeof mhdEeoSelfIdSchema>;
