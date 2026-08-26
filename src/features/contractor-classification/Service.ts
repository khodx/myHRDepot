import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdCaAb5ExemptionCategory,
  MhdContractorClassificationConfirmInput,
  MhdContractorClassificationDetermination,
  MhdContractorClassificationEvaluateInput,
  MhdContractorClassificationEvaluateResult,
  MhdContractorClassificationReadiness,
  MhdContractorClassificationSnapshot,
} from './Types';

const mapExemptionCategory = (row: Record<string, unknown>): MhdCaAb5ExemptionCategory => ({
  id: row.id as string,
  exemptionKey: row.exemption_key as string,
  categoryLabel: row.category_label as string,
  citation: row.citation as string,
  criteriaSummary: row.criteria_summary as string,
  effectiveFrom: row.effective_from as string,
  effectiveTo: (row.effective_to as string | null) ?? null,
  contentRegistryId: row.content_registry_id as string,
});

const mapDetermination = (row: Record<string, unknown>): MhdContractorClassificationDetermination => ({
  id: row.determination_id as string,
  snapshotId: row.snapshot_id as string,
  jurisdiction: row.jurisdiction as string,
  testKey: row.test_key as MhdContractorClassificationDetermination['testKey'],
  ruleSetId: row.rule_set_id as string,
  evaluatedOutcome: row.evaluated_outcome as MhdContractorClassificationDetermination['evaluatedOutcome'],
  effectiveOutcome: row.effective_outcome as MhdContractorClassificationDetermination['effectiveOutcome'],
  findings: row.findings as Record<string, unknown>,
  evaluatedAt: row.evaluated_at as string,
  evaluatedBy: (row.evaluated_by as string | null) ?? null,
  overrideReason: (row.override_reason as string | null) ?? null,
  overriddenAt: (row.overridden_at as string | null) ?? null,
  overriddenBy: (row.overridden_by as string | null) ?? null,
  confirmedAt: (row.confirmed_at as string | null) ?? null,
  confirmedBy: (row.confirmed_by as string | null) ?? null,
});

const mapSnapshot = (row: Record<string, unknown>): MhdContractorClassificationSnapshot => ({
  id: row.snapshot_id as string,
  companyId: row.company_id as string,
  personId: (row.person_id as string | null) ?? null,
  engagementLabel: (row.engagement_label as string | null) ?? null,
  asOfDate: row.as_of_date as string,
  engagementFacts: row.engagement_facts as Record<string, unknown>,
  selectedCaExemptionId: (row.selected_ca_exemption_id as string | null) ?? null,
  factsSource: row.facts_source as string,
  createdAt: row.created_at as string,
  createdBy: row.created_by as string,
  federalDeterminationId: (row.federal_determination_id as string | null) ?? null,
  federalTestKey: (row.federal_test_key as MhdContractorClassificationSnapshot['federalTestKey']) ?? null,
  federalRuleSetId: (row.federal_rule_set_id as string | null) ?? null,
  federalEvaluatedOutcome: (row.federal_evaluated_outcome as MhdContractorClassificationSnapshot['federalEvaluatedOutcome']) ?? null,
  federalEffectiveOutcome: (row.federal_effective_outcome as MhdContractorClassificationSnapshot['federalEffectiveOutcome']) ?? null,
  federalFindings: (row.federal_findings as Record<string, unknown> | null) ?? null,
  federalConfirmedAt: (row.federal_confirmed_at as string | null) ?? null,
  caDeterminationId: (row.ca_determination_id as string | null) ?? null,
  caTestKey: (row.ca_test_key as MhdContractorClassificationSnapshot['caTestKey']) ?? null,
  caRuleSetId: (row.ca_rule_set_id as string | null) ?? null,
  caEvaluatedOutcome: (row.ca_evaluated_outcome as MhdContractorClassificationSnapshot['caEvaluatedOutcome']) ?? null,
  caEffectiveOutcome: (row.ca_effective_outcome as MhdContractorClassificationSnapshot['caEffectiveOutcome']) ?? null,
  caFindings: (row.ca_findings as Record<string, unknown> | null) ?? null,
  caConfirmedAt: (row.ca_confirmed_at as string | null) ?? null,
});

const mapSingleSnapshot = (rows: Record<string, unknown>[]): MhdContractorClassificationSnapshot => {
  const first = rows[0];
  const snapshot = mapSnapshot(first);
  return {
    ...snapshot,
    determinations: rows.map(mapDetermination),
  };
};

const mapEvaluateResult = (row: Record<string, unknown>): MhdContractorClassificationEvaluateResult => ({
  snapshotId: row.snapshot_id as string,
  determinationId: row.determination_id as string,
  jurisdiction: row.jurisdiction as string,
  testKey: row.test_key as MhdContractorClassificationEvaluateResult['testKey'],
  ruleSetId: row.rule_set_id as string,
  evaluatedOutcome: row.evaluated_outcome as MhdContractorClassificationEvaluateResult['evaluatedOutcome'],
  effectiveOutcome: row.effective_outcome as MhdContractorClassificationEvaluateResult['effectiveOutcome'],
  findings: row.findings as Record<string, unknown>,
});

export const mhdContractorClassificationService = {
  async listExemptionCategories(): Promise<MhdCaAb5ExemptionCategory[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_ca_ab5_exemption_categories');
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapExemptionCategory);
  },
  async listSnapshots(companyId: string, personId?: string | null): Promise<MhdContractorClassificationSnapshot[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_contractor_classification_snapshots', {
      p_company_id: companyId,
      p_person_id: personId ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapSnapshot);
  },
  async getSnapshot(snapshotId: string): Promise<MhdContractorClassificationSnapshot | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_contractor_classification_snapshot', {
      p_snapshot_id: snapshotId,
    });
    if (error) throw error;
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    return rows.length ? mapSingleSnapshot(rows) : null;
  },
  async evaluate(input: MhdContractorClassificationEvaluateInput): Promise<MhdContractorClassificationEvaluateResult[]> {
    const { data, error } = await supabaseClient.rpc('mhd_contractor_classification_evaluate', {
      p_company_id: input.companyId,
      p_person_id: input.personId ?? undefined,
      p_engagement_label: input.engagementLabel,
      p_as_of_date: input.asOfDate,
      p_engagement_facts: input.engagementFacts as Json,
      p_selected_ca_exemption_id: input.selectedCaExemptionId ?? undefined,
      p_facts_source: input.factsSource ?? 'ADMIN_ENTERED',
    });
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapEvaluateResult);
  },
  async confirm(input: MhdContractorClassificationConfirmInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_contractor_classification_confirm', {
      p_determination_id: input.determinationId,
      p_confirmed_outcome: input.confirmedOutcome,
      p_override_reason: input.overrideReason ?? undefined,
    });
    if (error) throw error;
  },
  async readiness(): Promise<MhdContractorClassificationReadiness | null> {
    const { data, error } = await supabaseClient.rpc('mhd_compliance_module_readiness', {
      p_module_key: 'CONTRACTOR_CLASSIFICATION',
    });
    if (error) throw error;
    return ((data ?? []) as MhdContractorClassificationReadiness[])[0] ?? null;
  },
};
