import { z } from 'zod';
import {
  MHD_COMPETENCY_RATING_MAX,
  MHD_COMPETENCY_RATING_MIN,
  MHD_FEEDBACK_THRESHOLD_FLOOR,
  MHD_PARTICIPANT_TYPES,
  MHD_SECTION_RESPONSE_TYPES,
} from './Types-v2';

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.');

/**
 * The rating scale is fixed at 1–5 (ruling Q7) and is NOT configurable. A
 * configurable scale would require stamping the scale onto every historical
 * rating, or old ratings silently change meaning. Do not parameterise this.
 */
const competencyRating = z
  .number()
  .int()
  .min(MHD_COMPETENCY_RATING_MIN, 'Ratings run from 1 to 5.')
  .max(MHD_COMPETENCY_RATING_MAX, 'Ratings run from 1 to 5.');

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

/**
 * Inviting or nominating a rater.
 *
 * There is deliberately no `status` field. Whether this becomes an INVITED or a
 * NOMINATED row is the server's decision, taken from who is calling: the
 * reviewer or HR invites (ruling Q1), the subject may only nominate and the
 * reviewer approves (ruling Q2). A client-supplied status would let the subject
 * hand-pick their own raters, which is exactly the upward bias the approval step
 * exists to catch.
 */
export const mhdInviteParticipantSchema = z.object({
  reviewId: z.string().trim().min(1, 'Review is required.'),
  personId: z.string().trim().min(1, 'Select who should give feedback.'),
  participantType: z.enum(MHD_PARTICIPANT_TYPES),
});

export const mhdDeclineParticipationSchema = z.object({
  participantId: z.string().trim().min(1),
  // Optional by design. Declining is not compulsory to justify — the point of
  // recording the decline at all is that it stops being indistinguishable from
  // an invitation nobody ever looked at.
  reason: z.string().max(2000).optional().nullable(),
});

/**
 * Closing feedback collection early (ruling Q5).
 *
 * The reason is mandatory here and in the database
 * (`performance_reviews_feedback_close_reason`). Closing ends collection while
 * invitations are still outstanding; without a recorded reason there is no way to
 * tell a considered decision from someone who simply wanted the review off their
 * list.
 */
export const mhdCloseFeedbackSchema = z.object({
  reviewId: z.string().trim().min(1),
  reason: z
    .string()
    .trim()
    .min(1, 'Closing feedback collection requires a reason — invitations are still outstanding.')
    .max(2000),
});

// ---------------------------------------------------------------------------
// Feedback submission
// ---------------------------------------------------------------------------

/**
 * One answer. The competency/section pairing is a database CHECK
 * (`performance_feedback_target`) in both directions; mirroring it here turns a
 * constraint violation into a field-level message instead of a save failure.
 *
 * A response attached to neither cannot be aggregated or displayed and is simply
 * lost data — which is why "neither" is refused rather than dropped.
 */
export const mhdFeedbackResponseItemSchema = z
  .object({
    competencyId: z.string().trim().min(1).optional().nullable(),
    sectionId: z.string().trim().min(1).optional().nullable(),
    rating: competencyRating.optional().nullable(),
    comment: z.string().max(4000).optional().nullable(),
  })
  .refine((item) => Boolean(item.competencyId) !== Boolean(item.sectionId), {
    message: 'An answer must attach to exactly one competency or one section.',
    path: ['competencyId'],
  })
  .refine(
    (item) => item.rating != null || Boolean(item.comment && item.comment.trim().length > 0),
    {
      message: 'Give a rating, a comment, or both.',
      path: ['rating'],
    },
  );

/**
 * A rater's whole submission.
 *
 * Submitting REPLACES everything that participant sent before — the RPC deletes
 * their existing rows and re-inserts — so a partial payload silently erases the
 * rest. The `min(1)` guard stops an empty array from being sent as a submission,
 * which would mark the participant RESPONDED while wiping their answers.
 */
export const mhdSubmitFeedbackSchema = z.object({
  participantId: z.string().trim().min(1),
  responses: z
    .array(mhdFeedbackResponseItemSchema)
    .min(1, 'Answer at least one competency or section before submitting.')
    .refine((items) => {
      const targets = items.map((item) => item.competencyId ?? item.sectionId);
      return new Set(targets).size === targets.length;
    }, 'Each competency or section may be answered only once.'),
});

// ---------------------------------------------------------------------------
// Competency ratings on a review
// ---------------------------------------------------------------------------

export const mhdRateCompetencySchema = z.object({
  reviewCompetencyId: z.string().trim().min(1),
  rating: competencyRating,
  comments: z.string().max(4000).optional().nullable(),
});

/**
 * Adding a review-specific competency. There is no matching remove schema, and
 * that absence is deliberate: an INHERITED competency may never be removed
 * (ruling Q10, enforced by `trg_performance_competency_no_remove`), because
 * removal would let the criteria be narrowed after the fact — assessing someone
 * against less than the role required, leaving no trace.
 */
export const mhdAddReviewCompetencySchema = z.object({
  reviewId: z.string().trim().min(1),
  competencyId: z.string().trim().min(1, 'Select a competency to add.'),
});

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const mhdReviewTemplateSectionSchema = z.object({
  sectionTitle: z.string().trim().min(1, 'A section needs a title.').max(200),
  prompt: z.string().max(2000).optional().nullable(),
  responseType: z.enum(MHD_SECTION_RESPONSE_TYPES).default('RATING_AND_TEXT'),
  sortOrder: z.number().int().min(0).default(0),
});

/**
 * A template version.
 *
 * `companyId` null is the GLOBAL DEFAULT, adoptable by any company — the same
 * tiering as the competency library and the 0031 document-template keys.
 *
 * There is no edit schema for a PUBLISHED template. A published version is
 * immutable (`trg_performance_templates_immutable`) for the same reason a job
 * description version is: a completed review must remain explicable under the
 * template that produced it. Changing one means publishing a new version.
 */
export const mhdReviewTemplateSchema = z.object({
  companyId: z.string().trim().min(1).optional().nullable(),
  templateName: z.string().trim().min(1, 'Template name is required.').max(200),
  versionNumber: z.number().int().min(1).default(1),
  effectiveFrom: isoDate.optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  sections: z
    .array(mhdReviewTemplateSectionSchema)
    .min(1, 'A template with no sections would collect nothing.')
    .refine((sections) => {
      const titles = sections.map((section) => section.sectionTitle.trim().toLowerCase());
      return new Set(titles).size === titles.length;
    }, 'Two sections cannot share a title — raters would not know which they were answering.'),
});

// ---------------------------------------------------------------------------
// Company feedback settings
// ---------------------------------------------------------------------------

/**
 * The anonymity dial, and the only one there is.
 *
 * The floor of 3 is a database CHECK (`performance_feedback_threshold_floor`),
 * not merely a default: an aggregate over one or two responses is trivially
 * de-anonymised by anyone holding the invitation list, which is administratively
 * visible by necessity. Configurable UPWARD only.
 *
 * Upward feedback deserves the higher setting. A direct report rating the manager
 * who decides their pay is the most exposed participant in the system, and the
 * configurable threshold exists mainly for them.
 */
export const mhdFeedbackSettingsSchema = z.object({
  companyId: z.string().trim().min(1),
  minResponsesForRelease: z
    .number()
    .int()
    .min(
      MHD_FEEDBACK_THRESHOLD_FLOOR,
      'The release threshold cannot go below 3 — under three responses an aggregate identifies its authors.',
    )
    .max(50, 'A threshold this high would release nothing in a team of ordinary size.'),
  // Turning this off releases ratings without verbatim comments. It cannot make
  // comments release EARLIER than ratings: the threshold covers both, because
  // free text identifies more readily than a number, not less.
  releaseVerbatimComments: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Inferred form types
// ---------------------------------------------------------------------------

export type MhdInviteParticipantFormValues = z.infer<typeof mhdInviteParticipantSchema>;
export type MhdDeclineParticipationFormValues = z.infer<typeof mhdDeclineParticipationSchema>;
export type MhdCloseFeedbackFormValues = z.infer<typeof mhdCloseFeedbackSchema>;
export type MhdSubmitFeedbackFormValues = z.infer<typeof mhdSubmitFeedbackSchema>;
export type MhdRateCompetencyFormValues = z.infer<typeof mhdRateCompetencySchema>;
export type MhdAddReviewCompetencyFormValues = z.infer<typeof mhdAddReviewCompetencySchema>;
export type MhdReviewTemplateFormValues = z.infer<typeof mhdReviewTemplateSchema>;
export type MhdFeedbackSettingsFormValues = z.infer<typeof mhdFeedbackSettingsSchema>;
