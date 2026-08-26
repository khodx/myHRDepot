import type { MhdComplianceReadiness } from '@/types/mhdCompliance';

export type { MhdComplianceReadiness } from '@/types/mhdCompliance';

export type MhdContractorTestKey = 'FEDERAL_ECONOMIC_REALITY' | 'CA_ABC' | 'CA_BORELLO';
export type MhdContractorOutcome = 'CONTRACTOR' | 'EMPLOYEE' | 'UNDETERMINED';

export interface MhdCaAb5ExemptionCategory {
  id: string;
  exemptionKey: string;
  categoryLabel: string;
  citation: string;
  criteriaSummary: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  contentRegistryId: string;
}

export interface MhdContractorClassificationDetermination {
  id: string;
  snapshotId: string;
  jurisdiction: string;
  testKey: MhdContractorTestKey;
  ruleSetId: string;
  evaluatedOutcome: MhdContractorOutcome;
  effectiveOutcome: MhdContractorOutcome;
  findings: Record<string, unknown>;
  evaluatedAt: string;
  evaluatedBy: string | null;
  overrideReason: string | null;
  overriddenAt: string | null;
  overriddenBy: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
}

export interface MhdContractorClassificationSnapshot {
  id: string;
  companyId: string;
  personId: string | null;
  engagementLabel: string | null;
  asOfDate: string;
  engagementFacts: Record<string, unknown>;
  selectedCaExemptionId: string | null;
  factsSource: string;
  createdAt: string;
  createdBy: string;
  federalDeterminationId: string | null;
  federalTestKey: MhdContractorTestKey | null;
  federalRuleSetId: string | null;
  federalEvaluatedOutcome: MhdContractorOutcome | null;
  federalEffectiveOutcome: MhdContractorOutcome | null;
  federalFindings: Record<string, unknown> | null;
  federalConfirmedAt: string | null;
  caDeterminationId: string | null;
  caTestKey: MhdContractorTestKey | null;
  caRuleSetId: string | null;
  caEvaluatedOutcome: MhdContractorOutcome | null;
  caEffectiveOutcome: MhdContractorOutcome | null;
  caFindings: Record<string, unknown> | null;
  caConfirmedAt: string | null;
  determinations?: MhdContractorClassificationDetermination[];
}

export interface MhdContractorClassificationEvaluateInput {
  companyId: string;
  personId?: string | null;
  engagementLabel: string;
  asOfDate: string;
  engagementFacts: Record<string, unknown>;
  selectedCaExemptionId?: string | null;
  factsSource?: string;
}

export interface MhdContractorClassificationEvaluateResult {
  snapshotId: string;
  determinationId: string;
  jurisdiction: string;
  testKey: MhdContractorTestKey;
  ruleSetId: string;
  evaluatedOutcome: MhdContractorOutcome;
  effectiveOutcome: MhdContractorOutcome;
  findings: Record<string, unknown>;
}

export interface MhdContractorClassificationConfirmInput {
  determinationId: string;
  confirmedOutcome: MhdContractorOutcome;
  overrideReason?: string | null;
}

export type MhdContractorClassificationReadiness = MhdComplianceReadiness;
