import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdToNumber } from './Types';
import type {
  MhdAddCustomQuestionInput,
  MhdAddGuideQuestionInput,
  MhdCandidateEvaluation,
  MhdCreateInterviewInput,
  MhdCreateQuestionInput,
  MhdFinalizeEvaluationInput,
  MhdInterview,
  MhdInterviewCategory,
  MhdInterviewCategoryRpcRow,
  MhdInterviewEvaluationRollupRow,
  MhdInterviewEvaluationRollupRpcRow,
  MhdInterviewEvaluationRpcRow,
  MhdInterviewGuideItem,
  MhdInterviewGuideItemRpcRow,
  MhdInterviewJobCompetency,
  MhdInterviewJobCompetencyRpcRow,
  MhdInterviewMutationResult,
  MhdInterviewMutationRpcRow,
  MhdInterviewQuestion,
  MhdInterviewQuestionFilters,
  MhdInterviewQuestionRpcRow,
  MhdInterviewRpcRow,
  MhdInterviewWorksheetItem,
  MhdInterviewWorksheetItemRpcRow,
  MhdSubmitResponsesInput,
} from './Types';

// Contract-only access. Every method below calls `.rpc()` and nothing else —
// there is not a single `supabaseClient.from('interview_*')` select in this
// service. The whole surface is the 19 `mhd_interview_*` security-definer
// functions; every underlying table carries a `no_direct_write` policy and anon
// is revoked, so a direct insert/update/select is refused regardless of role.
// Access is enforced server-side: the bank + guide are `mhd_recruiting_is_privileged`
// gated, reads gate on `mhd_recruiting_can_view_requisition`, and the worksheet
// gates on `mhd_interview_can_access_interview` (view-the-requisition OR the
// assigned interviewer) — so an interviewer reaches only their own scorecard.
const interviewRpc = supabaseClient.rpc.bind(supabaseClient);

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCategory(row: MhdInterviewCategoryRpcRow): MhdInterviewCategory {
  return {
    id: row.id,
    categoryKey: row.category_key,
    categoryName: row.category_name,
    // PostgREST may serialise the integer as a string; normalise before use.
    sortOrder: mhdToNumber(row.sort_order),
    isGlobal: row.is_global,
  };
}

function mapQuestion(row: MhdInterviewQuestionRpcRow): MhdInterviewQuestion {
  return {
    id: row.id,
    companyId: row.company_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    questionKey: row.question_key,
    questionText: row.question_text,
    guidance: row.guidance,
    competencyId: row.competency_id,
    scope: row.scope as MhdInterviewQuestion['scope'],
    responseType: row.response_type as MhdInterviewQuestion['responseType'],
    complianceStatus: row.compliance_status as MhdInterviewQuestion['complianceStatus'],
    complianceGuidance: row.compliance_guidance,
    isGlobal: row.is_global,
  };
}

function mapJobCompetency(row: MhdInterviewJobCompetencyRpcRow): MhdInterviewJobCompetency {
  return {
    competencyId: row.competency_id,
    // Numeric weight PostgREST can hand back as a string; normalise.
    weight: mhdToNumber(row.weight),
  };
}

function mapGuideItem(row: MhdInterviewGuideItemRpcRow): MhdInterviewGuideItem {
  return {
    id: row.id,
    questionId: row.question_id,
    questionText: row.question_text,
    responseType: row.response_type as MhdInterviewGuideItem['responseType'],
    competencyId: row.competency_id,
    competencyName: row.competency_name,
    source: row.source as MhdInterviewGuideItem['source'],
    complianceStatus: row.compliance_status as MhdInterviewGuideItem['complianceStatus'],
    sortOrder: mhdToNumber(row.sort_order),
  };
}

function mapInterview(row: MhdInterviewRpcRow): MhdInterview {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdInterview['referenceId'],
    interviewerPersonId: row.interviewer_person_id,
    interviewerName: row.interviewer_name,
    guideId: row.guide_id,
    interviewType: row.interview_type,
    scheduledDate: row.scheduled_date,
    status: row.status as MhdInterview['status'],
    completedAt: row.completed_at,
  };
}

function mapWorksheetItem(row: MhdInterviewWorksheetItemRpcRow): MhdInterviewWorksheetItem {
  return {
    guideItemId: row.guide_item_id,
    questionText: row.question_text,
    responseType: row.response_type as MhdInterviewWorksheetItem['responseType'],
    competencyId: row.competency_id,
    competencyName: row.competency_name,
    complianceStatus: row.compliance_status as MhdInterviewWorksheetItem['complianceStatus'],
    complianceGuidance: row.compliance_guidance,
    // An unanswered rating is a meaningful null (not 0); preserve it.
    existingRating: row.existing_rating == null ? null : mhdToNumber(row.existing_rating),
    existingBool: row.existing_bool,
    existingText: row.existing_text,
  };
}

function mapRollupRow(
  row: MhdInterviewEvaluationRollupRpcRow,
): MhdInterviewEvaluationRollupRow {
  return {
    competencyId: row.competency_id,
    competencyName: row.competency_name,
    // Weighted-average inputs PostgREST can stringify; normalise before any bar math.
    weight: mhdToNumber(row.weight),
    avgRating: mhdToNumber(row.avg_rating),
    responseCount: mhdToNumber(row.response_count),
  };
}

function mapEvaluation(row: MhdInterviewEvaluationRpcRow): MhdCandidateEvaluation {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdCandidateEvaluation['referenceId'],
    overallRecommendation:
      row.overall_recommendation as MhdCandidateEvaluation['overallRecommendation'],
    decisionSummary: row.decision_summary,
    status: row.status as MhdCandidateEvaluation['status'],
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    // Derived server-side; a null score means "no rated responses yet" — keep it null.
    overallScore: row.overall_score == null ? null : mhdToNumber(row.overall_score),
  };
}

function mapMutationResult(row: MhdInterviewMutationRpcRow): MhdInterviewMutationResult {
  return { id: row.id, referenceId: row.reference_id };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdInterviewService = {
  // ----- Bank: categories + questions -----

  /**
   * The question-bank categories for a company — global packs plus company ones,
   * active only, ordered by sort. Gates on company access at the RPC.
   */
  async listCategories(companyId: string | null): Promise<MhdInterviewCategory[]> {
    if (!companyId) return [];
    const { data, error } = await interviewRpc('mhd_interview_category_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewCategoryRpcRow[]).map(mapCategory);
  },

  /**
   * The bank questions — global + company, active only, optionally narrowed to a
   * category and/or scope. Each carries its compliance flag + guidance. Any caller
   * with company access reads this (it gates on company access).
   */
  async listQuestions(filters: MhdInterviewQuestionFilters): Promise<MhdInterviewQuestion[]> {
    if (!filters.companyId) return [];
    const { data, error } = await interviewRpc('mhd_interview_question_list', {
      p_company_id: filters.companyId,
      p_category_id: trimmedOrUndefined(filters.categoryId),
      p_scope: filterValueOrUndefined(filters.scope),
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewQuestionRpcRow[]).map(mapQuestion);
  },

  /** Author a bank question. Admin-only at the RPC. Returns the new question id. */
  async createQuestion(input: MhdCreateQuestionInput): Promise<string> {
    const { data, error } = await interviewRpc('mhd_interview_question_create', {
      p_company_id: input.companyId,
      p_category_id: input.categoryId,
      p_question_key: input.questionKey.trim(),
      p_question_text: input.questionText.trim(),
      p_scope: input.scope ?? 'GENERAL',
      p_response_type: input.responseType ?? 'RATING_1_5',
      p_competency_id: trimmedOrUndefined(input.competencyId),
      p_guidance: trimmedOrUndefined(input.guidance),
      p_compliance_status: input.complianceStatus ?? 'REVIEW',
      p_compliance_guidance: trimmedOrUndefined(input.complianceGuidance),
    });
    if (error) throw error;
    return data as string;
  },

  // ----- Guide assembly -----

  /**
   * The competencies (with JD weights) of a requisition's job, from its latest
   * PUBLISHED description — the derivation spine for the job-specific questions and
   * the evaluation weighting. Empty when the req has no job or no published JD.
   */
  async jobCompetencies(requisitionId: string | null): Promise<MhdInterviewJobCompetency[]> {
    if (!requisitionId) return [];
    const { data, error } = await interviewRpc('mhd_interview_job_competencies', {
      p_requisition_id: requisitionId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewJobCompetencyRpcRow[]).map(mapJobCompetency);
  },

  /**
   * Get (or lazily create) the requisition's single guide. Admin-only at the RPC.
   * Returns the guide id — the handle the rest of the builder hangs off. Idempotent:
   * a second call returns the same guide.
   */
  async guideGetOrCreate(requisitionId: string): Promise<string> {
    const { data, error } = await interviewRpc('mhd_interview_guide_get_or_create', {
      p_requisition_id: requisitionId,
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * Assemble the guide: add every STANDARD question plus the JOB-competency-matched
   * ones not already present. Idempotent (re-runnable as the JD evolves). Admin-only.
   * Returns the count of items added.
   */
  async guideAssemble(guideId: string): Promise<number> {
    const { data, error } = await interviewRpc('mhd_interview_guide_assemble', {
      p_guide_id: guideId,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string | null);
  },

  /** Add a specific bank question to a guide (source BANK). Admin-only. Returns the item id. */
  async guideAddQuestion(input: MhdAddGuideQuestionInput): Promise<string> {
    const { data, error } = await interviewRpc('mhd_interview_guide_add_question', {
      p_guide_id: input.guideId,
      p_question_id: input.questionId,
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * Add a custom (inline) question to a guide, optionally saving it back to the bank
   * by category so the library grows. Admin-only. Returns the item id.
   */
  async guideAddCustom(input: MhdAddCustomQuestionInput): Promise<string> {
    const { data, error } = await interviewRpc('mhd_interview_guide_add_custom', {
      p_guide_id: input.guideId,
      p_question_text: input.questionText.trim(),
      p_response_type: input.responseType ?? 'RATING_1_5',
      p_competency_id: trimmedOrUndefined(input.competencyId),
      p_save_to_bank: input.saveToBank ?? false,
      p_category_id: trimmedOrUndefined(input.categoryId),
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * The assembled guide items, grouped in the UI by `source` and each carrying its
   * compliance flag. Visible to whoever can view the parent requisition (RLS).
   */
  async listGuideItems(guideId: string | null): Promise<MhdInterviewGuideItem[]> {
    if (!guideId) return [];
    const { data, error } = await interviewRpc('mhd_interview_guide_list_items', {
      p_guide_id: guideId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewGuideItemRpcRow[]).map(mapGuideItem);
  },

  /** Remove a guide item. Admin-only at the RPC. */
  async removeGuideItem(itemId: string): Promise<void> {
    const { error } = await interviewRpc('mhd_interview_guide_remove_item', {
      p_item_id: itemId,
    });
    if (error) throw error;
  },

  // ----- Interviews -----

  /**
   * Schedule an interview (record-only) for an application — interviewer, optional
   * guide, type, date. Admin-only at the RPC, which notifies the interviewer and
   * audits the create. Returns the minted `(id, reference_id)`.
   */
  async createInterview(input: MhdCreateInterviewInput): Promise<MhdInterviewMutationResult> {
    const { data, error } = await interviewRpc('mhd_interview_create', {
      p_application_id: input.applicationId,
      p_interviewer_person_id: input.interviewerPersonId,
      p_guide_id: trimmedOrUndefined(input.guideId),
      p_interview_type: trimmedOrUndefined(input.interviewType),
      p_scheduled_date: trimmedOrUndefined(input.scheduledDate),
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdInterviewMutationRpcRow[])[0];
    if (!row) throw new Error('Interview creation returned no row.');
    return mapMutationResult(row);
  },

  /**
   * The interviews on an application. Visible to whoever can view the parent
   * requisition (recruiter / hiring manager). Interviewers are not anonymous, so
   * each row carries the interviewer's name.
   */
  async listInterviews(applicationId: string | null): Promise<MhdInterview[]> {
    if (!applicationId) return [];
    const { data, error } = await interviewRpc('mhd_interview_list', {
      p_application_id: applicationId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewRpcRow[]).map(mapInterview);
  },

  /**
   * The interviewer's worksheet — one row per guide item, with any prior answer
   * prefilled and the compliance flag attached. Gated at the RPC on
   * `mhd_interview_can_access_interview` (view-the-requisition OR the assigned
   * interviewer), so an interviewer reaches only their own scorecard.
   */
  async getWorksheet(interviewId: string | null): Promise<MhdInterviewWorksheetItem[]> {
    if (!interviewId) return [];
    const { data, error } = await interviewRpc('mhd_interview_get_worksheet', {
      p_interview_id: interviewId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewWorksheetItemRpcRow[]).map(mapWorksheetItem);
  },

  /**
   * Submit the whole scorecard — the server SNAPSHOTS each question, replaces any
   * prior responses, and marks the interview COMPLETED. Returns the count written.
   *
   * The RPC takes `p_responses` as a jsonb array of
   * `{guide_item_id, rating?, response_bool?, response_text?}`. We build it here
   * from the camelCase drafts, emitting snake_case keys and including only the
   * field relevant to each item's response type — supabase-js serialises the array
   * to jsonb. The RPC is forgiving (`nullif(...,'')`, null casts), but we send only
   * meaningful values so a blank answer never lands as a spurious 0 / false.
   */
  async submitResponses(input: MhdSubmitResponsesInput): Promise<number> {
    const payload = input.responses.map((draft) => {
      const row: {
        guide_item_id: string;
        rating?: number;
        response_bool?: boolean;
        response_text?: string;
      } = { guide_item_id: draft.guideItemId };
      if (draft.rating != null) row.rating = draft.rating;
      if (draft.responseBool != null) row.response_bool = draft.responseBool;
      const text = trimmedOrUndefined(draft.responseText);
      if (text !== undefined) row.response_text = text;
      return row;
    });
    const { data, error } = await interviewRpc('mhd_interview_submit_responses', {
      p_interview_id: input.interviewId,
      p_responses: payload,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string | null);
  },

  // ----- Evaluation — the competency-weighted rollup -----

  /**
   * The per-competency weighted rollup across all COMPLETED interviews for an
   * application. DERIVED, never stored — render the bars from it; never recompute.
   */
  async evaluationRollup(applicationId: string | null): Promise<MhdInterviewEvaluationRollupRow[]> {
    if (!applicationId) return [];
    const { data, error } = await interviewRpc('mhd_interview_evaluation_rollup', {
      p_application_id: applicationId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInterviewEvaluationRollupRpcRow[]).map(mapRollupRow);
  },

  /**
   * The single overall weighted score, Σ(weight·avg)/Σweight. A scalar RPC — the
   * value comes back directly. DERIVED server-side; `null` when nothing is rated
   * yet. NEVER recompute this on the client from the rollup.
   */
  async evaluationOverallScore(applicationId: string | null): Promise<number | null> {
    if (!applicationId) return null;
    const { data, error } = await interviewRpc('mhd_interview_evaluation_overall_score', {
      p_application_id: applicationId,
    });
    if (error) throw error;
    return data == null ? null : mhdToNumber(data as number | string);
  },

  /**
   * Finalize (upsert) the hiring recommendation for an application. Admin-only at
   * the RPC, which audits the decision. Returns the evaluation `(id, reference_id)`.
   */
  async finalizeEvaluation(
    input: MhdFinalizeEvaluationInput,
  ): Promise<MhdInterviewMutationResult> {
    const { data, error } = await interviewRpc('mhd_interview_evaluation_finalize', {
      p_application_id: input.applicationId,
      p_recommendation: input.recommendation,
      p_summary: trimmedOrUndefined(input.summary),
      p_status: input.status ?? 'FINAL',
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdInterviewMutationRpcRow[])[0];
    if (!row) throw new Error('Evaluation finalize returned no row.');
    return mapMutationResult(row);
  },

  /**
   * The finalized evaluation record for an application (or `null` if none exists
   * yet). Carries the DERIVED `overallScore` re-computed server-side on read.
   */
  async getEvaluation(applicationId: string | null): Promise<MhdCandidateEvaluation | null> {
    if (!applicationId) return null;
    const { data, error } = await interviewRpc('mhd_interview_evaluation_get', {
      p_application_id: applicationId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdInterviewEvaluationRpcRow[])[0];
    return row ? mapEvaluation(row) : null;
  },
};
