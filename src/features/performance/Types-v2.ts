// ---------------------------------------------------------------------------
// Performance Management v2 — contract types
//
// This file covers ONLY the v2 surface added by `0035_performance_v2.sql`:
// competency ratings sourced from a stamped job-description version, module-owned
// review templates, participants, and threshold-gated 360 feedback. The v1 review
// and coaching-plan contracts stay in `Types.ts` and are unchanged.
//
// TODO(build-wave): retype from database.types.ts after 0035 gen:types —
// replace these local interfaces with
// `Database['public']['Functions']['mhd_performance_feedback_aggregate']['Returns'][number]`
// et al. once the migration has shipped and types are regenerated.
//
// Numeric RPC columns (`mean_rating`, `response_count`) are typed `number | string`
// because PostgREST serialises `numeric` as a string. Every mapper runs them
// through `mhdToNumber()` — never compare a raw row value arithmetically.
//
// ---------------------------------------------------------------------------
// THE ONE RULE THIS FILE EXISTS TO ENFORCE
//
// There is no readable row type for an individual PEER or UPWARD feedback
// response. Not here, not in `Service-v2.ts`, not in `Hook-v2.ts`. The database
// refuses to return one (RLS policy `performance_feedback_author_only`), and the
// contract refuses to name one, because a named shape is an invitation for a
// component to go looking for the data behind it.
//
// The ONLY route to peer content is `MhdFeedbackAggregateGroup`, produced by
// `mhd_performance_feedback_aggregate`, which releases nothing below the
// company threshold. `MhdSubmitFeedbackItem` below is a WRITE shape — what a
// rater sends about themselves — and has no read counterpart by design.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
// ---------------------------------------------------------------------------

/**
 * Row shape returned by `mhd_performance_feedback_aggregate`.
 *
 * One row per (participant_type, competency-or-section). SELF and MANAGER rows
 * always appear when a response exists — they are attributed by nature and are
 * never threshold-gated. PEER and UPWARD rows appear only once the group has
 * reached `min_responses_for_release`; below it the function returns NO ROW AT
 * ALL, not a row with a count and null ratings. A bare count leaks how many
 * people responded, which together with the invitation list is often enough to
 * identify them.
 */
export interface MhdFeedbackAggregateRpcRow {
  participant_type: string;
  competency_id: string | null;
  competency_name: string | null;
  section_id: string | null;
  section_title: string | null;
  response_count: number | string;
  /** Null when every response in the group was comment-only. */
  mean_rating: number | string | null;
  /**
   * Verbatim comments, gated by the SAME threshold as the ratings and
   * additionally by the company's `release_verbatim_comments` flag. Null means
   * withheld, not "nobody wrote anything" — free text identifies more readily
   * than a number, not less.
   */
  comments: string[] | null;
}

/** Row shape returned by `mhd_performance_list_review_competencies`. */
export interface MhdReviewCompetencyRpcRow {
  id: string;
  competency_id: string;
  competency_name: string;
  category: string | null;
  is_regulated: boolean;
  /** True when seeded from the stamped job description; false when added for this review. */
  is_inherited: boolean;
  rating: number | null;
  comments: string | null;
}

/**
 * Row shape returned by `mhd_performance_list_participants`.
 *
 * Who was asked, and whether they have answered — nothing about WHAT they said.
 * That separation is the whole shape of the table: invitation lists are
 * administratively necessary, responses are not.
 */
export interface MhdReviewParticipantRpcRow {
  id: string;
  person_id: string;
  person_display_name: string;
  participant_type: string;
  status: string;
  responded_at: string | null;
}

/**
 * Row shape returned by `mhd_performance_my_invitations`.
 *
 * The new visibility shape in v2: an invited rater holds a participant record on
 * a review they cannot otherwise read at all. Everything here is deliberately
 * thin — the subject's name and the period end, enough to answer meaningfully,
 * and nothing about the review itself.
 */
export interface MhdMyInvitationRpcRow {
  participant_id: string;
  review_id: string;
  subject_name: string;
  participant_type: string;
  status: string;
  review_period_end: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdReviewTemplateId = string;
export type MhdReviewTemplateReferenceId = `PRFT-${string}`;
export type MhdReviewTemplateSectionId = string;
export type MhdReviewCompetencyId = string;
export type MhdReviewParticipantId = string;

/**
 * Who is answering, and whether they can be named.
 *
 * SELF and MANAGER are attributed by nature — a self-assessment withheld from
 * its own author would be absurd, and the manager's view IS the review.
 * PEER and UPWARD are never attributed to anyone, under any role. UPWARD is the
 * most exposed position in the system: a direct report rating the manager who
 * decides their pay.
 */
export type MhdParticipantType = 'SELF' | 'MANAGER' | 'PEER' | 'UPWARD';

/**
 * `NOMINATED` is the subject's own suggestion and is NOT yet an invitation — it
 * needs the reviewer's approval first (ruling Q2). Self-selected raters bias
 * upward, so the approval step is the control. A nomination cannot submit.
 *
 * `DECLINED` is recorded rather than left pending forever: participation is not
 * compulsory, and a silent non-response is indistinguishable from an oversight.
 */
export type MhdParticipantStatus = 'NOMINATED' | 'INVITED' | 'RESPONDED' | 'DECLINED';

/** A PUBLISHED template version is immutable — a completed review must stay explicable. */
export type MhdReviewTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type MhdSectionResponseType = 'RATING' | 'TEXT' | 'RATING_AND_TEXT';

/** Extended by 0035; `QUARTERLY` and `PROBATIONARY` are the new values. */
export type MhdPerformanceReviewTypeV2 =
  | 'INTRODUCTORY'
  | 'ANNUAL'
  | 'QUARTERLY'
  | 'PROBATIONARY';

export const MHD_PARTICIPANT_TYPES = [
  'SELF',
  'MANAGER',
  'PEER',
  'UPWARD',
] as const satisfies readonly MhdParticipantType[];

/**
 * The types whose content is only ever exposed in aggregate. Kept as data rather
 * than as scattered `=== 'PEER'` checks so that any future participant type has
 * exactly one place to declare itself anonymous.
 */
export const MHD_ANONYMOUS_PARTICIPANT_TYPES = [
  'PEER',
  'UPWARD',
] as const satisfies readonly MhdParticipantType[];

export const MHD_PARTICIPANT_STATUSES = [
  'NOMINATED',
  'INVITED',
  'RESPONDED',
  'DECLINED',
] as const satisfies readonly MhdParticipantStatus[];

export const MHD_REVIEW_TEMPLATE_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
] as const satisfies readonly MhdReviewTemplateStatus[];

export const MHD_SECTION_RESPONSE_TYPES = [
  'RATING',
  'TEXT',
  'RATING_AND_TEXT',
] as const satisfies readonly MhdSectionResponseType[];

export const MHD_PERFORMANCE_REVIEW_TYPES_V2 = [
  'INTRODUCTORY',
  'ANNUAL',
  'QUARTERLY',
  'PROBATIONARY',
] as const satisfies readonly MhdPerformanceReviewTypeV2[];

/**
 * The absolute floor on `min_responses_for_release`, mirrored from the CHECK
 * `performance_feedback_threshold_floor`. Configurable UPWARD only — an
 * aggregate over one or two responses is trivially de-anonymised by anyone
 * holding the invitation list, so the schema refuses to let a company configure
 * its way below the point where anonymity means anything.
 */
export const MHD_FEEDBACK_THRESHOLD_FLOOR = 3;

/** Fixed 1–5 (ruling Q7), matching the existing `overall_rating` CHECK. */
export const MHD_COMPETENCY_RATING_MIN = 1;
export const MHD_COMPETENCY_RATING_MAX = 5;

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

/**
 * One aggregated group: a participant type crossed with a competency or a
 * template section (exactly one of the two, per the `performance_feedback_target`
 * CHECK).
 *
 * The presence of this object for an anonymous type is itself the signal that
 * the threshold was met. Its absence is the signal that it was not — see
 * `MhdFeedbackRelease` below, and never infer "no feedback" from a missing group.
 */
export interface MhdFeedbackAggregateGroup {
  participantType: MhdParticipantType;
  competencyId: string | null;
  competencyName: string | null;
  sectionId: MhdReviewTemplateSectionId | null;
  sectionTitle: string | null;
  responseCount: number;
  /** Null when the group carried comments only and no ratings. */
  meanRating: number | null;
  /** Empty when comments were withheld or none were written — see `commentsReleased`. */
  comments: string[];
  /**
   * False when the server sent `null` for comments, meaning the company has
   * `release_verbatim_comments` off. Distinct from an empty array with
   * `commentsReleased: true`, which genuinely means nobody wrote anything.
   */
  commentsReleased: boolean;
}

/**
 * Why an anonymous group is not on screen.
 *
 * The distinction matters and is the reason this type exists. A component that
 * renders an empty peer section says "nobody had anything to say", which is a
 * lie when in truth two people answered and the platform is protecting them.
 * The panel must say *"not enough responses to release"* explicitly.
 *
 * - `RELEASED`   — the threshold was met; groups are present.
 * - `WITHHELD`   — raters were invited, but fewer than the threshold have
 *                  responded. Say so. Do NOT render an empty section.
 * - `NOT_INVITED` — nobody of this type was ever asked. There is nothing to show
 *                  and nothing to explain.
 *
 * Note what `WITHHELD` deliberately does NOT carry: the number of responses
 * received. That figure is exactly what the threshold exists to hide, and the
 * server never sends it. Derive it from nothing.
 */
export type MhdFeedbackRelease = 'RELEASED' | 'WITHHELD' | 'NOT_INVITED';

export interface MhdReviewCompetency {
  id: MhdReviewCompetencyId;
  competencyId: string;
  competencyName: string;
  category: string | null;
  isRegulated: boolean;
  /**
   * Inherited competencies came from the job description in force at the review
   * period end and CANNOT be removed (ruling Q10, enforced by
   * `trg_performance_competency_no_remove`). Removal would let the criteria be
   * quietly narrowed after the fact — assessing someone against less than the
   * role required, with no trace that it happened. Render inherited rows without
   * a delete control rather than letting the database refuse the click.
   */
  isInherited: boolean;
  rating: number | null;
  comments: string | null;
}

export interface MhdReviewParticipant {
  id: MhdReviewParticipantId;
  personId: string;
  personDisplayName: string;
  participantType: MhdParticipantType;
  status: MhdParticipantStatus;
  respondedAt: string | null;
}

export interface MhdMyInvitation {
  participantId: MhdReviewParticipantId;
  reviewId: string;
  /** The person being reviewed. The only thing about the review a rater is told. */
  subjectName: string;
  participantType: MhdParticipantType;
  status: MhdParticipantStatus;
  reviewPeriodEnd: string;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * Inviting a rater. The server decides between INVITED and NOMINATED by asking
 * who is calling: the reviewer or HR invites directly (ruling Q1), the SUBJECT
 * may only nominate (ruling Q2). The client does not get to choose — there is no
 * `status` field here, deliberately.
 */
export interface MhdInviteParticipantInput {
  reviewId: string;
  personId: string;
  participantType: MhdParticipantType;
}

/**
 * One answer, about one competency or one template section — exactly one, never
 * both and never neither (`performance_feedback_target`). A response attached to
 * neither cannot be aggregated or displayed and is simply lost data.
 *
 * This is a WRITE shape only. There is no read counterpart for PEER or UPWARD.
 */
export interface MhdSubmitFeedbackItem {
  competencyId?: string | null;
  sectionId?: MhdReviewTemplateSectionId | null;
  rating?: number | null;
  comment?: string | null;
}

/**
 * A rater's whole submission. Submitting REPLACES everything previously sent by
 * that participant — the RPC deletes and re-inserts — so always send the
 * complete set, never a delta.
 */
export interface MhdSubmitFeedbackInput {
  participantId: MhdReviewParticipantId;
  responses: MhdSubmitFeedbackItem[];
}

export interface MhdDeclineParticipationInput {
  participantId: MhdReviewParticipantId;
  reason?: string | null;
}

/**
 * Ending collection while invitations are still outstanding (ruling Q5). The
 * reason is required by the database and by this contract: without it a review
 * completes while feedback is still arriving, and the aggregate shifts underneath
 * a document somebody has already signed, with no record of who decided that.
 */
export interface MhdCloseFeedbackInput {
  reviewId: string;
  reason: string;
}

export interface MhdRateCompetencyInput {
  reviewCompetencyId: MhdReviewCompetencyId;
  rating: number;
  comments?: string | null;
}

export interface MhdAddReviewCompetencyInput {
  reviewId: string;
  competencyId: string;
}

// ---------------------------------------------------------------------------
// Display + rule helpers
// ---------------------------------------------------------------------------

const PARTICIPANT_TYPE_LABELS: Record<MhdParticipantType, string> = {
  SELF: 'Self-assessment',
  MANAGER: 'Manager',
  PEER: 'Peer (anonymous)',
  UPWARD: 'Direct report (anonymous)',
};

const PARTICIPANT_STATUS_LABELS: Record<MhdParticipantStatus, string> = {
  NOMINATED: 'Nominated — awaiting approval',
  INVITED: 'Invited',
  RESPONDED: 'Responded',
  DECLINED: 'Declined',
};

const TEMPLATE_STATUS_LABELS: Record<MhdReviewTemplateStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const SECTION_RESPONSE_TYPE_LABELS: Record<MhdSectionResponseType, string> = {
  RATING: 'Rating only',
  TEXT: 'Comment only',
  RATING_AND_TEXT: 'Rating and comment',
};

export function mhdFormatParticipantType(value: MhdParticipantType | string): string {
  return PARTICIPANT_TYPE_LABELS[value as MhdParticipantType] ?? value;
}

export function mhdFormatParticipantStatus(value: MhdParticipantStatus | string): string {
  return PARTICIPANT_STATUS_LABELS[value as MhdParticipantStatus] ?? value;
}

export function mhdFormatReviewTemplateStatus(value: MhdReviewTemplateStatus | string): string {
  return TEMPLATE_STATUS_LABELS[value as MhdReviewTemplateStatus] ?? value;
}

export function mhdFormatSectionResponseType(value: MhdSectionResponseType | string): string {
  return SECTION_RESPONSE_TYPE_LABELS[value as MhdSectionResponseType] ?? value;
}

/** True for the types whose individual responses are never attributed to anyone. */
export function mhdIsAnonymousParticipantType(value: MhdParticipantType | string): boolean {
  return (MHD_ANONYMOUS_PARTICIPANT_TYPES as readonly string[]).includes(value);
}

/**
 * Why a participant type has no aggregate on screen — the question every 360
 * panel has to answer before it renders anything.
 *
 * It takes the participant LIST as well as the aggregate because that is the
 * only honest way to tell the two empty states apart. Who was asked is visible
 * by design; what they said is not. If somebody was asked and no group came
 * back, the platform is withholding, and the panel must say so.
 *
 * SELF and MANAGER are never gated, so for those types a missing group really
 * does mean nothing was submitted.
 */
export function mhdFeedbackReleaseState(
  participantType: MhdParticipantType,
  groups: MhdFeedbackAggregateGroup[],
  participants: MhdReviewParticipant[],
): MhdFeedbackRelease {
  if (groups.some((group) => group.participantType === participantType)) return 'RELEASED';
  const invited = participants.some(
    (participant) =>
      participant.participantType === participantType && participant.status !== 'DECLINED',
  );
  if (!invited) return 'NOT_INVITED';
  return mhdIsAnonymousParticipantType(participantType) ? 'WITHHELD' : 'NOT_INVITED';
}

/**
 * The sentence a panel should show for a withheld group. Kept here rather than in
 * a component so every surface says the same thing, and so nobody is tempted to
 * improvise a message that implies the feedback was empty.
 *
 * Note it names the threshold but never the number of responses received.
 */
export function mhdFeedbackWithheldMessage(threshold: number): string {
  return `Not enough responses to release. Feedback is shown only once at least ${threshold} people have answered, so no individual answer can be identified.`;
}

/**
 * What a rater must be told BEFORE they write, not after (ruling Q4). Comments
 * release with the aggregate or not at all; a rater who believed their words were
 * private and finds them quoted has been misled by the product.
 */
export function mhdFeedbackRaterNotice(
  participantType: MhdParticipantType,
  threshold: number,
): string {
  if (!mhdIsAnonymousParticipantType(participantType)) {
    return 'Your name is shown with this response — it is your own view of the review.';
  }
  return `Your answer is anonymous. It is combined with other responses and released only once at least ${threshold} people have answered. Any comment you write is released the same way, in your own words.`;
}

/** Ratings a reviewer still has to give before the competency section is complete. */
export function mhdUnratedCompetencies(competencies: MhdReviewCompetency[]): MhdReviewCompetency[] {
  return competencies.filter((competency) => competency.rating == null);
}

/**
 * Participants who can still answer. Mirrors the server's own count in
 * `mhd_performance_close_feedback` so the reviewer sees what closing would
 * override before they commit to it.
 */
export function mhdOutstandingParticipants(
  participants: MhdReviewParticipant[],
): MhdReviewParticipant[] {
  return participants.filter(
    (participant) => participant.status === 'NOMINATED' || participant.status === 'INVITED',
  );
}

/** PostgREST serialises `numeric` as a string; normalise before any arithmetic. */
export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
