import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAccommodationRequestCreateInput,
  MhdAccommodationRequestRpcRow,
  MhdAssessment,
  MhdAssessmentAttempt,
  MhdAssessmentAttemptRpcRow,
  MhdAssessmentAttemptStartRpcRow,
  MhdAssessmentAttemptSubmitResult,
  MhdAssessmentAttemptSubmitRpcRow,
  MhdAssessmentCreateInput,
  MhdAssessmentCreateRpcRow,
  MhdAssessmentGetRpcRow,
  MhdAssessmentItem,
  MhdAssessmentItemCreateInput,
  MhdAssessmentItemRpcRow,
  MhdMutationResult,
} from './Types';

// Contract-only access — same posture as mhdTrainingService: every method below calls
// `supabaseClient.rpc()` directly and nothing else. supabaseClient.rpc is called directly rather
// than bound to a local alias for the same TS2589 instantiation-depth reason documented in
// training's Service.ts.

function mapItem(row: MhdAssessmentItemRpcRow): MhdAssessmentItem {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdAssessmentItem['referenceId'],
    questionType: row.question_type,
    prompt: row.prompt,
    options: row.options,
    requiresManualGrading: row.requires_manual_grading,
    tags: row.tags,
    difficulty: row.difficulty,
    competencyId: row.competency_id,
    isActive: row.is_active,
  };
}

function mapAttempt(row: MhdAssessmentAttemptRpcRow): MhdAssessmentAttempt {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdAssessmentAttempt['referenceId'],
    personId: row.person_id,
    attemptNumber: row.attempt_number,
    status: row.status,
    scorePercent: row.score_percent,
    passed: row.passed,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
  };
}

function mapMutationResult(row: { id: string; reference_id: string }): MhdMutationResult {
  return { id: row.id, referenceId: row.reference_id };
}

export const mhdAssessmentService = {
  async listItems(companyId: string, tag: string | null = null): Promise<MhdAssessmentItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_item_list', {
      p_company_id: companyId,
      p_tag: tag ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAssessmentItemRpcRow[]).map(mapItem);
  },

  async createItem(input: MhdAssessmentItemCreateInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_item_create', {
      p_company_id: input.companyId,
      p_question_type: input.questionType,
      p_prompt: input.prompt.trim(),
      p_options: (input.options ?? []) as never,
      p_correct_answer: (input.correctAnswer ?? undefined) as never,
      p_tags: input.tags ?? [],
      p_difficulty: input.difficulty ?? undefined,
      p_competency_id: input.competencyId ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdAssessmentCreateRpcRow[])[0];
    if (!row) throw new Error('Assessment item creation returned no row.');
    return mapMutationResult(row);
  },

  async create(input: MhdAssessmentCreateInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_create', {
      p_company_id: input.companyId,
      p_title: input.title.trim(),
      p_assembly_mode: input.assemblyMode ?? 'FIXED',
      p_course_id: input.courseId ?? undefined,
      p_integrity_profile: input.integrityProfile ?? 'LIGHT',
      p_time_limit_minutes: input.timeLimitMinutes ?? undefined,
      p_item_ids: input.itemIds ?? [],
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdAssessmentCreateRpcRow[])[0];
    if (!row) throw new Error('Assessment creation returned no row.');
    return mapMutationResult(row);
  },

  async get(assessmentId: string): Promise<MhdAssessment | null> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_get', {
      p_assessment_id: assessmentId,
    });
    if (error) throw error;
    const rows = (data ?? []) as MhdAssessmentGetRpcRow[];
    const first = rows[0];
    if (!first) return null;
    return {
      id: first.id,
      referenceId: first.reference_id as MhdAssessment['referenceId'],
      companyId: first.company_id,
      courseId: first.course_id,
      title: first.title,
      assemblyMode: first.assembly_mode,
      integrityProfile: first.integrity_profile,
      timeLimitMinutes: first.time_limit_minutes,
      items: rows
        .filter((row) => row.item_id)
        .map((row) => ({
          itemId: row.item_id!,
          questionType: row.question_type!,
          prompt: row.prompt!,
          options: row.options,
          sortOrder: row.sort_order!,
        })),
    };
  },

  async createAccommodationRequest(
    input: MhdAccommodationRequestCreateInput,
  ): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_accommodation_request_create', {
      p_company_id: input.companyId,
      p_assessment_id: input.assessmentId,
      p_person_id: input.personId,
      p_extended_time_percent: input.extendedTimePercent ?? undefined,
      p_attempt_count_override: input.attemptCountOverride ?? undefined,
      p_integrity_profile_override: input.integrityProfileOverride ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdAccommodationRequestRpcRow[])[0];
    if (!row) throw new Error('Accommodation request creation returned no row.');
    return mapMutationResult(row);
  },

  async decideAccommodationRequest(
    requestId: string,
    approve: boolean,
    notes: string | null = null,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_accommodation_request_decide', {
      p_request_id: requestId,
      p_approve: approve,
      p_notes: notes ?? undefined,
    });
    if (error) throw error;
  },

  async startAttempt(
    assessmentId: string,
    assignmentId: string | null = null,
  ): Promise<MhdMutationResult & { attemptNumber: number }> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_attempt_start', {
      p_assessment_id: assessmentId,
      p_assignment_id: assignmentId ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdAssessmentAttemptStartRpcRow[])[0];
    if (!row) throw new Error('Assessment attempt start returned no row.');
    return { id: row.id, referenceId: row.reference_id, attemptNumber: row.attempt_number };
  },

  async submitAttempt(
    attemptId: string,
    responses: Record<string, unknown>,
  ): Promise<MhdAssessmentAttemptSubmitResult> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_attempt_submit', {
      p_attempt_id: attemptId,
      p_responses: responses as never,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdAssessmentAttemptSubmitRpcRow[])[0];
    if (!row) throw new Error('Assessment attempt submission returned no row.');
    return { status: row.status, scorePercent: row.score_percent, passed: row.passed };
  },

  async gradeAttempt(attemptId: string, scorePercent: number, passed: boolean): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_training_assessment_attempt_grade', {
      p_attempt_id: attemptId,
      p_score_percent: scorePercent,
      p_passed: passed,
    });
    if (error) throw error;
  },

  async listAttempts(
    assessmentId: string,
    personId: string | null = null,
  ): Promise<MhdAssessmentAttempt[]> {
    const { data, error } = await supabaseClient.rpc('mhd_training_assessment_attempt_list', {
      p_assessment_id: assessmentId,
      p_person_id: personId ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAssessmentAttemptRpcRow[]).map(mapAttempt);
  },
};
