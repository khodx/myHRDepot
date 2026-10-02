import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { MhdPerformanceReviewType } from './Types';
import type {
  MhdPerformanceCycle,
  MhdPerformanceCycleCandidate,
  MhdPerformanceCycleCandidateFilters,
  MhdPerformanceCycleLaunchInput,
  MhdPerformanceCycleLaunchResult,
  MhdPerformanceCycleProgress,
  MhdPerformanceCycleRaterKind,
  MhdPerformanceCycleRaterPlanInput,
  MhdPerformanceCycleRaterSuggestion,
  MhdPerformanceCycleStatus,
} from './Types-cycles';

// supabaseClient.rpc is called directly rather than bound to a local alias, for the same
// TS2589 reason as Service-v2.ts.

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

export const mhdPerformanceCycleService = {
  /** People who can be put in a cycle, walked down the manager hierarchy by the server. */
  async listCandidates(
    filters: MhdPerformanceCycleCandidateFilters,
  ): Promise<MhdPerformanceCycleCandidate[]> {
    const { data, error } = await supabaseClient.rpc('mhd_performance_cycle_candidates', {
      p_company_id: filters.companyId,
      ...(filters.rootPersonId ? { p_root_person_id: filters.rootPersonId } : {}),
      p_include_indirect: filters.includeIndirect ?? true,
      ...(filters.reviewType ? { p_review_type: filters.reviewType } : {}),
      ...(filters.periodStart ? { p_period_start: filters.periodStart } : {}),
      ...(filters.periodEnd ? { p_period_end: filters.periodEnd } : {}),
    });
    if (error) throw new Error(`Unable to load the people for this cycle: ${error.message}`);
    return (data ?? []).map((row) => ({
      personId: row.person_id,
      displayName: row.display_name,
      jobTitle: row.job_title,
      managerPersonId: row.manager_person_id,
      managerName: row.manager_name,
      depth: row.depth,
      reviewerUserId: row.reviewer_user_id,
      reviewerName: row.reviewer_name,
      hasPublishedJob: row.has_published_job,
      competencyCount: row.competency_count,
      conflictingReviewReference: row.conflicting_review_reference,
    }));
  },

  /** A recommendation of peers and upward raters; the person removes any they do not want. */
  async planRaters(
    input: MhdPerformanceCycleRaterPlanInput,
  ): Promise<MhdPerformanceCycleRaterSuggestion[]> {
    const { data, error } = await supabaseClient.rpc('mhd_performance_cycle_rater_plan', {
      p_company_id: input.companyId,
      p_person_ids: input.personIds,
      p_include_peers: input.includePeers,
      p_max_peers: input.maxPeers,
      p_include_upward: input.includeUpward,
      p_max_upward: input.maxUpward,
    });
    if (error) throw new Error(`Unable to suggest raters: ${error.message}`);
    return (data ?? []).map((row) => ({
      subjectPersonId: row.subject_person_id,
      raterPersonId: row.rater_person_id,
      raterName: row.rater_name,
      participantType: row.participant_type as MhdPerformanceCycleRaterKind,
    }));
  },

  /** Creates the cycle, every review, the competencies and the invitations in one transaction. */
  async launch(input: MhdPerformanceCycleLaunchInput): Promise<MhdPerformanceCycleLaunchResult> {
    const { data, error } = await supabaseClient.rpc('mhd_performance_cycle_launch', {
      p_company_id: input.companyId,
      p_cycle: {
        cycle_name: input.cycleName,
        review_type: input.reviewType,
        review_period_start: input.reviewPeriodStart,
        review_period_end: input.reviewPeriodEnd,
        self_assessment_due: input.selfAssessmentDue || null,
        feedback_due: input.feedbackDue || null,
        review_due: input.reviewDue,
        template_id: input.templateId || null,
        includes_self_assessment: input.includesSelfAssessment,
        is_multi_rater: input.isMultiRater,
        announcement_note: input.announcementNote || null,
      },
      p_participants: input.participants.map((participant) => ({
        person_id: participant.personId,
        reviewer_user_id: participant.reviewerUserId,
        raters: participant.raters.map((rater) => ({
          person_id: rater.personId,
          participant_type: rater.participantType,
        })),
      })),
      p_competency_ids: input.competencyIds,
    });
    if (error) throw new Error(error.message);
    const raw = asRecord(data);
    return {
      id: String(raw.id),
      referenceId: String(raw.reference_id),
      reviewCount: Number(raw.review_count),
      participantCount: Number(raw.participant_count),
    };
  },

  async listCycles(companyId: string): Promise<MhdPerformanceCycle[]> {
    const { data, error } = await supabaseClient.rpc('mhd_performance_cycle_list', {
      p_company_id: companyId,
    });
    if (error) throw new Error(`Unable to load review cycles: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      referenceId: row.reference_id,
      cycleName: row.cycle_name,
      reviewType: row.review_type as MhdPerformanceReviewType,
      reviewPeriodStart: row.review_period_start,
      reviewPeriodEnd: row.review_period_end,
      selfAssessmentDue: row.self_assessment_due,
      feedbackDue: row.feedback_due,
      reviewDue: row.review_due,
      status: row.status as MhdPerformanceCycleStatus,
      templateName: row.template_name,
      isMultiRater: row.is_multi_rater,
      launchedAt: row.launched_at,
      reviewCount: row.review_count,
      completedCount: row.completed_count,
      overdueCount: row.overdue_count,
    }));
  },

  async getProgress(cycleId: string): Promise<MhdPerformanceCycleProgress> {
    const { data, error } = await supabaseClient.rpc('mhd_performance_cycle_progress', {
      p_cycle_id: cycleId,
    });
    if (error) throw new Error(`Unable to load cycle progress: ${error.message}`);
    const raw = asRecord(data);
    return {
      reviewsByStatus: asRecord(raw.reviews_by_status) as Record<string, number>,
      participants: ((raw.participants as Array<Record<string, unknown>> | null) ?? []).map(
        (row) => ({
          participantType: String(row.participant_type),
          status: String(row.status),
          count: Number(row.count),
        }),
      ),
      selfAssessmentsOverdue: Number(raw.self_assessments_overdue ?? 0),
      feedbackOverdue: Number(raw.feedback_overdue ?? 0),
      reviewsOverdue: Number(raw.reviews_overdue ?? 0),
    };
  },

  async closeCycle(cycleId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_performance_cycle_close', {
      p_cycle_id: cycleId,
    });
    if (error) throw new Error(error.message);
  },
};
