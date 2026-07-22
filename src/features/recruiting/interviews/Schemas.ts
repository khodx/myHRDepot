import { z } from 'zod';
import {
  MHD_CANDIDATE_EVALUATION_STATUSES,
  MHD_INTERVIEW_COMPLIANCE_STATUSES,
  MHD_INTERVIEW_QUESTION_SCOPES,
  MHD_INTERVIEW_RECOMMENDATIONS,
  MHD_INTERVIEW_RESPONSE_TYPES,
} from './Types';

// ---------------------------------------------------------------------------
// Bank question authoring
// ---------------------------------------------------------------------------

/**
 * Authoring a bank question. `questionKey` is the stable per-scope identifier;
 * `categoryId` places it in the library. `scope` drives assembly (STANDARD is
 * pulled for every candidate) and defaults to GENERAL; `responseType` defaults to
 * a 1–5 rating (the only type that feeds the weighted rollup). `complianceStatus`
 * defaults to REVIEW — new content is unreviewed until an admin/attorney clears it.
 * This schema validates the payload only; the RPC remains the authority on who may
 * author (the three admin roles).
 */
export const mhdQuestionCreateSchema = z.object({
  companyId: z.string().trim().min(1, 'Company is required.'),
  categoryId: z.string().trim().min(1, 'Choose a category.'),
  questionKey: z
    .string()
    .trim()
    .min(1, 'A question key is required.')
    .max(120, 'That key is longer than the record supports.'),
  questionText: z
    .string()
    .trim()
    .min(1, 'A question is required.')
    .max(2000, 'That question is longer than the record supports.'),
  scope: z.enum(MHD_INTERVIEW_QUESTION_SCOPES, {
    error: 'Choose a scope.',
  }),
  responseType: z.enum(MHD_INTERVIEW_RESPONSE_TYPES, {
    error: 'Choose a response type.',
  }),
  // Optional JD link — chosen from the competency picker; blank means unset.
  competencyId: z.string().trim().optional().nullable().or(z.literal('')),
  guidance: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  complianceStatus: z.enum(MHD_INTERVIEW_COMPLIANCE_STATUSES, {
    error: 'Choose a compliance status.',
  }),
  complianceGuidance: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Guide: add custom question
// ---------------------------------------------------------------------------

/**
 * Adding a custom (inline) question to a guide. `saveToBank` optionally writes it
 * back to the company bank (as a GENERAL question, compliance REVIEW) so the
 * library grows; when set, a `categoryId` places the saved copy. `responseType`
 * defaults to a 1–5 rating.
 */
export const mhdAddCustomQuestionSchema = z.object({
  guideId: z.string().trim().min(1),
  questionText: z
    .string()
    .trim()
    .min(1, 'A question is required.')
    .max(2000, 'That question is longer than the record supports.'),
  responseType: z.enum(MHD_INTERVIEW_RESPONSE_TYPES, {
    error: 'Choose a response type.',
  }),
  competencyId: z.string().trim().optional().nullable().or(z.literal('')),
  saveToBank: z.boolean().default(false),
  categoryId: z.string().trim().optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Interview scheduling (record-only)
// ---------------------------------------------------------------------------

/**
 * Scheduling an interview. Record-only in v1 — an interviewer (a person), an
 * optional interview type and date, and the guide it draws from. `interviewerPersonId`
 * is chosen from the People picker; naming it assigns and notifies that interviewer.
 */
export const mhdInterviewScheduleSchema = z.object({
  applicationId: z.string().trim().min(1),
  interviewerPersonId: z.string().trim().min(1, 'Choose an interviewer.'),
  guideId: z.string().trim().optional().nullable().or(z.literal('')),
  interviewType: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  // The date input hands back a `yyyy-mm-dd` string; blank means unscheduled.
  scheduledDate: z.string().trim().optional().nullable().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Evaluation finalize (the recommendation form)
// ---------------------------------------------------------------------------

/**
 * Finalizing the evaluation. A recommendation is required (the four-point scale);
 * a summary is optional free text. `status` defaults to FINAL — DRAFT lets a
 * recruiter record a leaning without stamping the decision. The weighted score is
 * DERIVED server-side and is NOT part of this form; it is never entered by hand.
 */
export const mhdEvaluationFinalizeSchema = z.object({
  applicationId: z.string().trim().min(1),
  recommendation: z.enum(MHD_INTERVIEW_RECOMMENDATIONS, {
    error: 'Choose a recommendation.',
  }),
  summary: z.string().trim().max(4000).optional().nullable().or(z.literal('')),
  status: z.enum(MHD_CANDIDATE_EVALUATION_STATUSES, {
    error: 'Choose a status.',
  }),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdQuestionCreateFormValues = z.infer<typeof mhdQuestionCreateSchema>;
export type MhdAddCustomQuestionFormValues = z.infer<typeof mhdAddCustomQuestionSchema>;
export type MhdInterviewScheduleFormValues = z.infer<typeof mhdInterviewScheduleSchema>;
export type MhdEvaluationFinalizeFormValues = z.infer<typeof mhdEvaluationFinalizeSchema>;

// NOTE: the worksheet (scorecard) has NO zod schema here. Its fields are dynamic —
// one input per guide item, keyed by `response_type`, the set unknown until
// `get_worksheet` returns — so `MhdInterviewWorksheet` holds its answers in local
// controlled state keyed by `guideItemId` and hands them to the service as
// `MhdInterviewResponseDraft[]`. A rigid object schema cannot describe that shape;
// per-input validity (a 1–5 rating) is enforced by the inputs themselves.
