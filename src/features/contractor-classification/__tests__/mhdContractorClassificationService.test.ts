import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdContractorClassificationService } from '../Service';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc },
}));

describe('mhdContractorClassificationService', () => {
  beforeEach(() => rpc.mockReset());

  it('maps an exemption category from snake_case', async () => {
    rpc.mockResolvedValue({ data: [{
      id: 'category-1', exemption_key: 'LICENSED_PROFESSIONAL', category_label: 'Licensed professional',
      citation: 'Cal. Lab. Code §§ 2775–2787', criteria_summary: 'Verify the statutory criteria.',
      effective_from: '2020-01-01', effective_to: null, content_registry_id: 'content-1',
    }], error: null });

    await expect(mhdContractorClassificationService.listExemptionCategories()).resolves.toEqual([{
      id: 'category-1', exemptionKey: 'LICENSED_PROFESSIONAL', categoryLabel: 'Licensed professional',
      citation: 'Cal. Lab. Code §§ 2775–2787', criteriaSummary: 'Verify the statutory criteria.',
      effectiveFrom: '2020-01-01', effectiveTo: null, contentRegistryId: 'content-1',
    }]);
    expect(rpc).toHaveBeenCalledWith('mhd_list_ca_ab5_exemption_categories');
  });

  it('maps the flattened listSnapshots shape', async () => {
    rpc.mockResolvedValue({ data: [{
      snapshot_id: 'snapshot-1', company_id: 'company-1', person_id: null, engagement_label: 'Consultant',
      as_of_date: '2026-08-25', engagement_facts: { factor: 'CONTRACTOR' }, selected_ca_exemption_id: 'category-1',
      facts_source: 'ADMIN_ENTERED', created_at: '2026-08-25T10:00:00Z', created_by: 'user-1',
      federal_determination_id: 'fed-1', federal_test_key: 'FEDERAL_ECONOMIC_REALITY', federal_rule_set_id: 'rule-fed',
      federal_evaluated_outcome: 'CONTRACTOR', federal_effective_outcome: 'CONTRACTOR', federal_findings: { score: 6 },
      federal_confirmed_at: '2026-08-25T10:01:00Z', ca_determination_id: 'ca-1', ca_test_key: 'CA_BORELLO',
      ca_rule_set_id: 'rule-ca', ca_evaluated_outcome: 'EMPLOYEE', ca_effective_outcome: 'EMPLOYEE',
      ca_findings: { score: 2 }, ca_confirmed_at: null,
    }], error: null });

    await expect(mhdContractorClassificationService.listSnapshots('company-1')).resolves.toEqual([{
      id: 'snapshot-1', companyId: 'company-1', personId: null, engagementLabel: 'Consultant', asOfDate: '2026-08-25',
      engagementFacts: { factor: 'CONTRACTOR' }, selectedCaExemptionId: 'category-1', factsSource: 'ADMIN_ENTERED',
      createdAt: '2026-08-25T10:00:00Z', createdBy: 'user-1', federalDeterminationId: 'fed-1',
      federalTestKey: 'FEDERAL_ECONOMIC_REALITY', federalRuleSetId: 'rule-fed', federalEvaluatedOutcome: 'CONTRACTOR',
      federalEffectiveOutcome: 'CONTRACTOR', federalFindings: { score: 6 }, federalConfirmedAt: '2026-08-25T10:01:00Z',
      caDeterminationId: 'ca-1', caTestKey: 'CA_BORELLO', caRuleSetId: 'rule-ca', caEvaluatedOutcome: 'EMPLOYEE',
      caEffectiveOutcome: 'EMPLOYEE', caFindings: { score: 2 }, caConfirmedAt: null,
    }]);
    expect(rpc).toHaveBeenCalledWith('mhd_list_contractor_classification_snapshots', {
      p_company_id: 'company-1', p_person_id: undefined,
    });
  });

  it('maps the grouped getSnapshot shape and its determinations', async () => {
    const snapshot = {
      snapshot_id: 'snapshot-1', company_id: 'company-1', person_id: 'person-1', engagement_label: 'Consultant',
      as_of_date: '2026-08-25', engagement_facts: {}, selected_ca_exemption_id: null, facts_source: 'ADMIN_ENTERED',
      created_at: '2026-08-25T10:00:00Z', created_by: 'user-1',
    };
    rpc.mockResolvedValue({ data: [
      { ...snapshot, determination_id: 'fed-1', jurisdiction: 'FEDERAL', test_key: 'FEDERAL_ECONOMIC_REALITY',
        rule_set_id: 'rule-fed', evaluated_outcome: 'CONTRACTOR', effective_outcome: 'CONTRACTOR', findings: { score: 6 },
        evaluated_at: '2026-08-25T10:00:01Z', evaluated_by: 'user-1', override_reason: null, overridden_at: null,
        overridden_by: null, confirmed_at: '2026-08-25T10:01:00Z', confirmed_by: 'user-1' },
      { ...snapshot, determination_id: 'ca-1', jurisdiction: 'CA', test_key: 'CA_ABC', rule_set_id: 'rule-ca',
        evaluated_outcome: 'EMPLOYEE', effective_outcome: 'EMPLOYEE', findings: { failed: 'B' }, evaluated_at: '2026-08-25T10:00:01Z',
        evaluated_by: 'user-1', override_reason: null, overridden_at: null, overridden_by: null, confirmed_at: null, confirmed_by: null },
    ], error: null });

    await expect(mhdContractorClassificationService.getSnapshot('snapshot-1')).resolves.toEqual({
      id: 'snapshot-1', companyId: 'company-1', personId: 'person-1', engagementLabel: 'Consultant', asOfDate: '2026-08-25',
      engagementFacts: {}, selectedCaExemptionId: null, factsSource: 'ADMIN_ENTERED', createdAt: '2026-08-25T10:00:00Z', createdBy: 'user-1',
      federalDeterminationId: null, federalTestKey: null, federalRuleSetId: null, federalEvaluatedOutcome: null,
      federalEffectiveOutcome: null, federalFindings: null, federalConfirmedAt: null, caDeterminationId: null, caTestKey: null,
      caRuleSetId: null, caEvaluatedOutcome: null, caEffectiveOutcome: null, caFindings: null, caConfirmedAt: null,
      determinations: [
        { id: 'fed-1', snapshotId: 'snapshot-1', jurisdiction: 'FEDERAL', testKey: 'FEDERAL_ECONOMIC_REALITY', ruleSetId: 'rule-fed', evaluatedOutcome: 'CONTRACTOR', effectiveOutcome: 'CONTRACTOR', findings: { score: 6 }, evaluatedAt: '2026-08-25T10:00:01Z', evaluatedBy: 'user-1', overrideReason: null, overriddenAt: null, overriddenBy: null, confirmedAt: '2026-08-25T10:01:00Z', confirmedBy: 'user-1' },
        { id: 'ca-1', snapshotId: 'snapshot-1', jurisdiction: 'CA', testKey: 'CA_ABC', ruleSetId: 'rule-ca', evaluatedOutcome: 'EMPLOYEE', effectiveOutcome: 'EMPLOYEE', findings: { failed: 'B' }, evaluatedAt: '2026-08-25T10:00:01Z', evaluatedBy: 'user-1', overrideReason: null, overriddenAt: null, overriddenBy: null, confirmedAt: null, confirmedBy: null },
      ],
    });
    expect(rpc).toHaveBeenCalledWith('mhd_get_contractor_classification_snapshot', { p_snapshot_id: 'snapshot-1' });
  });

  it('evaluates with the real RPC params, undefined for omitted optional inputs, and maps multiple rows', async () => {
    rpc.mockResolvedValue({ data: [
      { snapshot_id: 's1', determination_id: 'd1', jurisdiction: 'FEDERAL', test_key: 'FEDERAL_ECONOMIC_REALITY', rule_set_id: 'rf', evaluated_outcome: 'CONTRACTOR', effective_outcome: 'CONTRACTOR', findings: { score: 6 } },
      { snapshot_id: 's1', determination_id: 'd2', jurisdiction: 'CA', test_key: 'CA_ABC', rule_set_id: 'rc', evaluated_outcome: 'EMPLOYEE', effective_outcome: 'EMPLOYEE', findings: { failed: 'B' } },
    ], error: null });
    const input = { companyId: 'company-1', engagementLabel: 'Consultant', asOfDate: '2026-08-25', engagementFacts: { A: 'CONTRACTOR' } };

    await expect(mhdContractorClassificationService.evaluate(input)).resolves.toEqual([
      { snapshotId: 's1', determinationId: 'd1', jurisdiction: 'FEDERAL', testKey: 'FEDERAL_ECONOMIC_REALITY', ruleSetId: 'rf', evaluatedOutcome: 'CONTRACTOR', effectiveOutcome: 'CONTRACTOR', findings: { score: 6 } },
      { snapshotId: 's1', determinationId: 'd2', jurisdiction: 'CA', testKey: 'CA_ABC', ruleSetId: 'rc', evaluatedOutcome: 'EMPLOYEE', effectiveOutcome: 'EMPLOYEE', findings: { failed: 'B' } },
    ]);
    expect(rpc).toHaveBeenCalledWith('mhd_contractor_classification_evaluate', {
      p_company_id: 'company-1', p_person_id: undefined, p_engagement_label: 'Consultant', p_as_of_date: '2026-08-25',
      p_engagement_facts: { A: 'CONTRACTOR' }, p_selected_ca_exemption_id: undefined, p_facts_source: 'ADMIN_ENTERED',
    });
  });

  it('confirms with an override reason when provided and omits it when not', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await mhdContractorClassificationService.confirm({ determinationId: 'd1', confirmedOutcome: 'CONTRACTOR' });
    expect(rpc).toHaveBeenNthCalledWith(1, 'mhd_contractor_classification_confirm', {
      p_determination_id: 'd1', p_confirmed_outcome: 'CONTRACTOR', p_override_reason: undefined,
    });
    await mhdContractorClassificationService.confirm({ determinationId: 'd2', confirmedOutcome: 'EMPLOYEE', overrideReason: 'Reviewed facts' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'mhd_contractor_classification_confirm', {
      p_determination_id: 'd2', p_confirmed_outcome: 'EMPLOYEE', p_override_reason: 'Reviewed facts',
    });
  });

  it('calls readiness with the module key and returns the first row or null', async () => {
    rpc.mockResolvedValueOnce({ data: [{ module_key: 'CONTRACTOR_CLASSIFICATION', release_ready: false, blocker_count: 4 }], error: null });
    await expect(mhdContractorClassificationService.readiness()).resolves.toEqual({ module_key: 'CONTRACTOR_CLASSIFICATION', release_ready: false, blocker_count: 4 });
    expect(rpc).toHaveBeenNthCalledWith(1, 'mhd_compliance_module_readiness', { p_module_key: 'CONTRACTOR_CLASSIFICATION' });
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(mhdContractorClassificationService.readiness()).resolves.toBeNull();
  });
});
