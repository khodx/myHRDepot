import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddReviewCompetencyInput,
  MhdCloseFeedbackInput,
  MhdDeclineParticipationInput,
  MhdFeedbackAggregateGroup,
  MhdFeedbackAggregateRpcRow,
  MhdInviteParticipantInput,
  MhdMyInvitation,
  MhdMyInvitationRpcRow,
  MhdRateCompetencyInput,
  MhdReviewCompetency,
  MhdReviewCompetencyRpcRow,
  MhdReviewParticipant,
  MhdReviewParticipantRpcRow,
  MhdSubmitFeedbackInput,
} from './Types-v2';
import { mhdToNumber } from './Types-v2';

const performanceRpc = supabaseClient.rpc.bind(supabaseClient);

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * The aggregate row is the ONLY sanctioned route to peer and upward content, and
 * this mapper is the only place it is shaped. It adds nothing the server did not
 * send, and in particular it never fabricates a zero-count group for a
 * participant type that came back missing — a missing group is the signal that
 * the threshold was not met, and inventing a placeholder would destroy it.
 */
function mapAggregateGroup(row: MhdFeedbackAggregateRpcRow): MhdFeedbackAggregateGroup {
  return {
    participantType: row.participant_type as MhdFeedbackAggregateGroup['participantType'],
    competencyId: row.competency_id,
    competencyName: row.competency_name,
    sectionId: row.section_id,
    sectionTitle: row.section_title,
    responseCount: mhdToNumber(row.response_count),
    // `mean_rating` arrives as a string (`numeric`), and null when the group
    // carried comments only. Preserve the null rather than collapsing it to 0 —
    // "no rating given" and "rated zero" are different, and zero is not even a
    // legal rating on a 1–5 scale.
    meanRating: row.mean_rating == null ? null : mhdToNumber(row.mean_rating),
    comments: row.comments ?? [],
    // Null comments mean the company has release_verbatim_comments off; an empty
    // array means nobody wrote anything. The panel must be able to tell those
    // apart, so the distinction is carried rather than flattened.
    commentsReleased: row.comments != null,
  };
}

function mapReviewCompetency(row: MhdReviewCompetencyRpcRow): MhdReviewCompetency {
  return {
    id: row.id,
    competencyId: row.competency_id,
    competencyName: row.competency_name,
    category: row.category,
    isRegulated: row.is_regulated,
    isInherited: row.is_inherited,
    rating: row.rating == null ? null : mhdToNumber(row.rating),
    comments: row.comments,
  };
}

function mapParticipant(row: MhdReviewParticipantRpcRow): MhdReviewParticipant {
  return {
    id: row.id,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    participantType: row.participant_type as MhdReviewParticipant['participantType'],
    status: row.status as MhdReviewParticipant['status'],
    respondedAt: row.responded_at,
  };
}

function mapMyInvitation(row: MhdMyInvitationRpcRow): MhdMyInvitation {
  return {
    participantId: row.participant_id,
    reviewId: row.review_id,
    subjectName: row.subject_name,
    participantType: row.participant_type as MhdMyInvitation['participantType'],
    status: row.status as MhdMyInvitation['status'],
    reviewPeriodEnd: row.review_period_end,
  };
}

// ---------------------------------------------------------------------------
// Service
//
// Covers the v2 surface only. Review CRUD, transitions and the signature
// ceremony remain in `Service.ts` and are untouched by 0035.
//
// NOTE THE ABSENCE, it is the point of the module: there is no
// `listFeedbackResponses`, no `getParticipantResponse`, no method of any name
// that returns an individual PEER or UPWARD answer. The database will not serve
// one (RLS `performance_feedback_author_only`), and no method here asks. If a
// component needs peer content it calls `feedbackAggregate` and handles the
// withheld case; there is no second path, and none should be added.
// ---------------------------------------------------------------------------

export const mhdPerformanceV2Service = {
  // ----- Feedback settings and aggregation -----

  /**
   * The company's release threshold — the number of responses an anonymous group
   * needs before anything at all is shown. Defaults to 3 and cannot be set lower.
   *
   * Read it BEFORE rendering a feedback panel: it is what the withheld message
   * has to name, and what a rater is told before they write.
   */
  async feedbackThreshold(companyId: string): Promise<number> {
    const { data, error } = await performanceRpc('mhd_performance_feedback_threshold', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string);
  },

  /**
   * Aggregated 360 feedback for a review.
   *
   * AN EMPTY ARRAY IS A NORMAL RESULT AND MUST NOT BE READ AS "no feedback". The
   * function returns nothing at all below the threshold — not zeros, not a count
   * with null ratings — because a bare count leaks how many people responded,
   * which together with the (visible) invitation list is often enough to identify
   * them. Cross-reference `listParticipants` and use
   * `mhdFeedbackReleaseState` to tell withheld from never-asked, then say which.
   *
   * SELF and MANAGER groups are never gated and appear as soon as they exist.
   */
  async feedbackAggregate(reviewId: string): Promise<MhdFeedbackAggregateGroup[]> {
    const { data, error } = await performanceRpc('mhd_performance_feedback_aggregate', {
      p_review_id: reviewId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdFeedbackAggregateRpcRow[]).map(mapAggregateGroup);
  },

  // ----- Participant lifecycle -----

  /**
   * Invite a rater, or nominate one. Returns the new participant id.
   *
   * Which of the two happens is the server's call, not the caller's: the subject
   * of the review can only NOMINATE and needs the reviewer's approval, while the
   * reviewer and HR invite directly (rulings Q1/Q2). Read the resulting status
   * back from `listParticipants` rather than assuming INVITED.
   */
  async inviteParticipant(input: MhdInviteParticipantInput): Promise<string> {
    const { data, error } = await performanceRpc('mhd_performance_invite_participant', {
      p_review_id: input.reviewId,
      p_person_id: input.personId,
      p_participant_type: input.participantType,
    });
    if (error) throw error;
    return data as string;
  },

  /** Turn a subject's nomination into a real invitation. Reviewer/HR only. */
  async approveParticipant(participantId: string): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_approve_participant', {
      p_participant_id: participantId,
    });
    if (error) throw error;
  },

  /**
   * Submit a rater's own feedback.
   *
   * Only the invited person may call this for themselves — no administrator can
   * submit on someone's behalf, because a response attributed to a rater who did
   * not write it is worse than no response at all.
   *
   * REPLACES the participant's previous answers wholesale: the RPC deletes their
   * existing rows before inserting. Always send the complete set.
   */
  async submitFeedback(input: MhdSubmitFeedbackInput): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_submit_feedback', {
      p_participant_id: input.participantId,
      // Sent as a jsonb array of snake_case objects — the RPC reads
      // `competency_id`, `section_id`, `rating` and `comment` off each element.
      p_responses: input.responses.map((response) => ({
        competency_id: response.competencyId ?? null,
        section_id: response.sectionId ?? null,
        rating: response.rating ?? null,
        comment: trimmedOrUndefined(response.comment) ?? null,
      })),
    });
    if (error) throw error;
  },

  /**
   * Decline an invitation. Only the invited person may decline.
   *
   * The reason is optional — recording the decline is what matters, so that a
   * refusal stops looking like an invitation nobody ever opened.
   */
  async declineParticipation(input: MhdDeclineParticipationInput): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_decline_participation', {
      p_participant_id: input.participantId,
      p_reason: trimmedOrUndefined(input.reason),
    });
    if (error) throw error;
  },

  /**
   * End feedback collection while invitations are still outstanding (ruling Q5).
   *
   * The reason is mandatory both here and in the database. Without this control a
   * review completes while feedback is still arriving and the aggregate shifts
   * underneath a document somebody has already signed; the recorded reason is
   * what makes that a decision rather than an accident.
   */
  async closeFeedback(input: MhdCloseFeedbackInput): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_close_feedback', {
      p_review_id: input.reviewId,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  // ----- Competencies on a review -----

  /**
   * Seed the review's competencies from the job description in force AT THE
   * REVIEW PERIOD END — not today. A review of last quarter is assessed against
   * the role as it was defined then; the resolved description id is stamped onto
   * the review so reopening it a year later reproduces the same criteria.
   *
   * Returns the number seeded. ZERO IS NOT AN ERROR: a person with no published
   * description is normal in an organisation part-way through writing them, and
   * the review simply proceeds on template sections alone.
   */
  async seedCompetencies(reviewId: string): Promise<number> {
    const { data, error } = await performanceRpc('mhd_performance_seed_competencies', {
      p_review_id: reviewId,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string);
  },

  /**
   * Add a review-specific competency. Returns the new row id.
   *
   * There is no counterpart that removes one, and there will not be: an inherited
   * competency cannot be removed (ruling Q10), because removal would let the
   * criteria be quietly narrowed after the fact.
   */
  async addReviewCompetency(input: MhdAddReviewCompetencyInput): Promise<string> {
    const { data, error } = await performanceRpc('mhd_performance_add_review_competency', {
      p_review_id: input.reviewId,
      p_competency_id: input.competencyId,
    });
    if (error) throw error;
    return data as string;
  },

  /** Rate one competency, 1–5. Comments are merged, not cleared, when omitted. */
  async rateCompetency(input: MhdRateCompetencyInput): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_rate_competency', {
      p_review_competency_id: input.reviewCompetencyId,
      p_rating: input.rating,
      // The RPC coalesces onto the existing value, so an undefined here LEAVES
      // the previous comment in place rather than blanking it.
      p_comments: trimmedOrUndefined(input.comments),
    });
    if (error) throw error;
  },

  /** Inherited rows first, then review-specific additions, each in seeded order. */
  async listReviewCompetencies(reviewId: string): Promise<MhdReviewCompetency[]> {
    const { data, error } = await performanceRpc('mhd_performance_list_review_competencies', {
      p_review_id: reviewId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdReviewCompetencyRpcRow[]).map(mapReviewCompetency);
  },

  /**
   * Who was asked, and whether they have answered — never what they said.
   *
   * This list is also what makes the withheld state legible: it is the only way a
   * panel can tell "two peers were asked and we are protecting them" from
   * "no peers were ever invited". That is exactly why the threshold exists — the
   * list is administratively necessary and therefore visible, so an aggregate
   * over one or two responses would be de-anonymised by anyone reading it.
   */
  async listParticipants(reviewId: string): Promise<MhdReviewParticipant[]> {
    const { data, error } = await performanceRpc('mhd_performance_list_participants', {
      p_review_id: reviewId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdReviewParticipantRpcRow[]).map(mapParticipant);
  },

  /**
   * The invited rater's own view: their outstanding and answered invitations, and
   * nothing else about the reviews behind them.
   *
   * This is the new visibility shape in v2 — a participant record on a review the
   * caller cannot read at all. Takes no arguments: the RPC resolves the caller
   * from `auth.uid()`, so there is no person id to pass and no way to ask for
   * somebody else's invitations.
   */
  async myInvitations(): Promise<MhdMyInvitation[]> {
    const { data, error } = await performanceRpc('mhd_performance_my_invitations');
    if (error) throw error;
    return ((data ?? []) as MhdMyInvitationRpcRow[]).map(mapMyInvitation);
  },

  // ----- Templates and settings (privileged; through RPCs, not direct table writes) -----
  //
  // These config tables refuse direct writes at the RLS layer — a no-direct-write policy — so the
  // only sanctioned path is these RPCs, each of which re-asserts the privileged set. A component
  // that tried to insert a template row directly would be refused by the database.

  async listTemplates(companyId: string): Promise<
    Array<{
      id: string;
      referenceId: string;
      companyId: string | null;
      templateName: string;
      versionNumber: number;
      status: string;
      isGlobal: boolean;
      sectionCount: number;
    }>
  > {
    const { data, error } = await performanceRpc('mhd_performance_list_templates', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return (
      (data ?? []) as Array<{
        id: string;
        reference_id: string;
        company_id: string | null;
        template_name: string;
        version_number: number | string;
        status: string;
        is_global: boolean;
        section_count: number | string;
      }>
    ).map((row) => ({
      id: row.id,
      referenceId: row.reference_id,
      companyId: row.company_id,
      templateName: row.template_name,
      versionNumber: mhdToNumber(row.version_number),
      status: row.status,
      isGlobal: row.is_global,
      sectionCount: mhdToNumber(row.section_count),
    }));
  },

  async createTemplate(input: {
    companyId: string | null;
    templateName: string;
    description?: string | null;
    sections: Array<{ sectionTitle: string; prompt?: string | null; responseType: string }>;
  }): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await performanceRpc('mhd_performance_create_template', {
      // Sent explicitly: null MEANS the global default template (Platform Admin only), which is a
      // different authorisation from a company template — not an omitted argument. The generated
      // arg type is non-null (PostgREST cannot express a nullable arg); the RPC accepts null
      // server-side, so the runtime null is preserved through this cast.
      p_company_id: input.companyId as string,
      p_template_name: input.templateName.trim(),
      p_description: input.description ?? undefined,
      p_sections: input.sections.map((s) => ({
        section_title: s.sectionTitle,
        prompt: s.prompt ?? null,
        response_type: s.responseType,
      })),
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Template creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async publishTemplate(templateId: string, effectiveFrom?: string | null): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_publish_template', {
      p_template_id: templateId,
      p_effective_from: effectiveFrom ?? undefined,
    });
    if (error) throw error;
  },

  async getSettings(
    companyId: string,
  ): Promise<{ minResponsesForRelease: number; releaseVerbatimComments: boolean }> {
    const { data, error } = await performanceRpc('mhd_performance_get_settings', {
      p_company_id: companyId,
    });
    if (error) throw error;
    const row = (
      (data ?? []) as Array<{
        min_responses_for_release: number | string;
        release_verbatim_comments: boolean;
      }>
    )[0];
    // A company with no settings row resolves to the defaults server-side; the RPC always returns
    // one row, so this fallback is belt-and-braces.
    return {
      minResponsesForRelease: row ? mhdToNumber(row.min_responses_for_release) : 3,
      releaseVerbatimComments: row ? row.release_verbatim_comments : true,
    };
  },

  async upsertSettings(
    companyId: string,
    minResponsesForRelease: number,
    releaseVerbatimComments: boolean,
  ): Promise<void> {
    const { error } = await performanceRpc('mhd_performance_upsert_settings', {
      p_company_id: companyId,
      p_min_responses_for_release: minResponsesForRelease,
      p_release_verbatim_comments: releaseVerbatimComments,
    });
    if (error) throw error;
  },
};
