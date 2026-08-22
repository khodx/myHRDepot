import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdComplianceReadiness,
  MhdJobClassificationEvaluateInput,
  MhdJobClassificationEvaluateResult,
  MhdJobEvaluationScoreInput,
  MhdJobPayGradeConfirmInput,
  MhdJobPayGradeRecommendation,
  MhdJobPayGradeRecommendInput,
  MhdCareerOneStopWageLookupInput,
  MhdCareerOneStopWageLookupResponse,
  MhdMarketWageLookupInput,
  MhdMarketWageLookupResponse,
} from './Types';

const mapClassificationResult = (row: Record<string, unknown>): MhdJobClassificationEvaluateResult => ({
  snapshotId: row.snapshot_id as string,
  determinationId: row.determination_id as string,
  jurisdiction: row.jurisdiction as string,
  evaluatedOutcome: row.evaluated_outcome as string,
  findings: row.findings as Record<string, unknown>,
});

const mapPayGradeRecommendation = (row: Record<string, unknown>): MhdJobPayGradeRecommendation => ({
  recommendationId: row.recommendation_id as string,
  totalPoints: row.total_points as number | string,
  recommendedPayGradeId: (row.recommended_pay_grade_id as string | null) ?? null,
});

export const mhdCompensationService = {
  async evaluate(input: MhdJobClassificationEvaluateInput): Promise<MhdJobClassificationEvaluateResult[]> {
    const { data, error } = await supabaseClient.rpc('mhd_job_classification_evaluate', {
      p_job_id: input.jobId,
      p_as_of_date: input.asOfDate,
      p_exemption_category: input.exemptionCategory,
      p_employer_employee_count: input.employerEmployeeCount ?? undefined,
      p_weekly_salary: input.weeklySalary ?? undefined,
      p_hourly_rate: input.hourlyRate ?? undefined,
      p_primary_duties_percent_time: (input.primaryDutiesPercentTime ?? {}) as Json,
      p_ksa_inputs: (input.ksaInputs ?? {}) as Json,
      p_facts_source: input.factsSource ?? 'ADMIN_ENTERED',
    });
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapClassificationResult);
  },

  async confirm(determinationId: string) {
    const { error } = await supabaseClient.rpc('mhd_job_classification_confirm', {
      p_determination_id: determinationId,
    });
    if (error) throw error;
  },

  async override(input: {
    determinationId: string;
    effectiveOutcome: 'EXEMPT' | 'NON_EXEMPT' | 'UNDETERMINED';
    overrideReason: string;
  }) {
    const reason = input.overrideReason.trim();
    if (!reason) throw new Error('A classification override requires a recorded reason.');
    const { error } = await supabaseClient.rpc('mhd_job_classification_override', {
      p_determination_id: input.determinationId,
      p_effective_outcome: input.effectiveOutcome,
      p_override_reason: reason,
    });
    if (error) throw error;
  },

  async score(input: MhdJobEvaluationScoreInput) {
    const { error } = await supabaseClient.rpc('mhd_job_evaluation_score', {
      p_snapshot_id: input.snapshotId,
      p_factor_scores: input.factorScores.map((score) => ({
        factor_key: score.factorKey,
        points: score.points,
        ...(score.weight === undefined ? {} : { weight: score.weight }),
        ...(score.notes === undefined ? {} : { notes: score.notes }),
      })) as Json,
    });
    if (error) throw error;
  },

  async payGradeRecommend(input: MhdJobPayGradeRecommendInput): Promise<MhdJobPayGradeRecommendation[]> {
    const { data, error } = await supabaseClient.rpc('mhd_job_pay_grade_recommend', {
      p_snapshot_id: input.snapshotId,
      p_market_reference_snapshot_id: input.marketReferenceSnapshotId ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapPayGradeRecommendation);
  },

  async payGradeConfirm(input: MhdJobPayGradeConfirmInput) {
    const { error } = await supabaseClient.rpc('mhd_job_pay_grade_confirm', {
      p_recommendation_id: input.recommendationId,
      p_confirmed_pay_grade_id: input.confirmedPayGradeId,
      p_override_reason: input.overrideReason ?? undefined,
    });
    if (error) throw error;
  },

  async marketWageLookup(input: MhdMarketWageLookupInput): Promise<MhdMarketWageLookupResponse> {
    const { data, error } = await supabaseClient.functions.invoke('bls-oews-lookup', { body: input });
    if (error) throw error;
    const response = data as MhdMarketWageLookupResponse | undefined;
    if (response?.success === false) throw new Error(response.error);
    return response as MhdMarketWageLookupResponse;
  },

  async careerOneStopWageLookup(input: MhdCareerOneStopWageLookupInput): Promise<MhdCareerOneStopWageLookupResponse> {
    const { data, error } = await supabaseClient.functions.invoke('careeronestop-occupation-lookup', {
      body: { ...input, includeWages: true, includeDuties: false },
    });
    if (error) throw error;
    const response = data as MhdCareerOneStopWageLookupResponse | undefined;
    if (response?.success === false) throw new Error(response.error);
    return response as MhdCareerOneStopWageLookupResponse;
  },

  async readiness(): Promise<MhdComplianceReadiness | null> {
    const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
      p_module_key: 'COMPENSATION',
    });
    if (error) throw error;
    return ((data ?? []) as MhdComplianceReadiness[])[0] ?? null;
  },
};
