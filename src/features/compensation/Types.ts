import type { MhdComplianceReadiness } from '@/types/mhdCompliance';

export type { MhdComplianceReadiness } from '@/types/mhdCompliance';

export interface MhdJobClassificationDetermination {
  id: string;
  snapshotId: string;
  jurisdiction: string;
  exemptionCategory: string;
  evaluatedOutcome: string;
  effectiveOutcome: string;
  findings: Record<string, unknown>;
  overrideReason: string | null;
  confirmedAt: string | null;
  evaluatedAt: string;
}

export interface MhdJobClassificationEvaluateResult {
  snapshotId: string;
  determinationId: string;
  jurisdiction: string;
  evaluatedOutcome: string;
  findings: Record<string, unknown>;
}

export interface MhdJobClassificationEvaluateInput {
  jobId: string;
  asOfDate: string;
  exemptionCategory: 'EXECUTIVE' | 'ADMINISTRATIVE' | 'PROFESSIONAL' | 'COMPUTER' | 'OUTSIDE_SALES' | 'HCE';
  employerEmployeeCount?: number | null;
  weeklySalary?: number | null;
  hourlyRate?: number | null;
  primaryDutiesPercentTime?: Record<string, unknown>;
  ksaInputs?: Record<string, unknown>;
  factsSource?: string;
}

export interface MhdJobEvaluationFactorScore {
  factorKey: string;
  points: number;
  weight?: number;
  notes?: string;
}

export interface MhdJobEvaluationScoreInput {
  snapshotId: string;
  factorScores: MhdJobEvaluationFactorScore[];
}

export interface MhdJobPayGradeRecommendInput {
  snapshotId: string;
  marketReferenceSnapshotId?: string | null;
}

export interface MhdJobPayGradeRecommendation {
  recommendationId: string;
  totalPoints: number | string;
  recommendedPayGradeId: string | null;
}

export interface MhdJobPayGradeConfirmInput {
  recommendationId: string;
  confirmedPayGradeId: string;
  overrideReason?: string | null;
}

export interface MhdMarketWageLookupInput {
  jobId: string;
  onetSocCode: string;
  areaType?: 'N' | 'S' | 'M';
  areaCode?: string;
}

export interface MhdMarketWageLookupSuccess {
  success: true;
  snapshotId: string;
  socCode: string;
  dataYear: number;
  source: string;
  hourlyPercentile10?: number;
  hourlyPercentile25?: number;
  hourlyMedian?: number;
  hourlyPercentile75?: number;
  hourlyPercentile90?: number;
  annualPercentile10?: number;
  annualPercentile25?: number;
  annualMedian?: number;
  annualPercentile75?: number;
  annualPercentile90?: number;
}

export interface MhdMarketWageLookupFailure {
  success: false;
  error: string;
}

export type MhdMarketWageLookupResponse = MhdMarketWageLookupSuccess | MhdMarketWageLookupFailure;

export interface MhdCareerOneStopWageLookupInput {
  jobId: string;
  onetSocCode: string;
  location?: string;
}

export interface MhdCareerOneStopWageLookupSuccess {
  success: true;
  cached: boolean;
  snapshotId?: string;
  socCode: string;
  onetTitle?: string | null;
  onetDescription?: string | null;
  dataYear?: number | null;
  areaName?: string | null;
  source: string;
  hourlyPercentile10?: number | null;
  hourlyPercentile25?: number | null;
  hourlyMedian?: number | null;
  hourlyPercentile75?: number | null;
  hourlyPercentile90?: number | null;
  annualPercentile10?: number | null;
  annualPercentile25?: number | null;
  annualMedian?: number | null;
  annualPercentile75?: number | null;
  annualPercentile90?: number | null;
}

export interface MhdCareerOneStopWageLookupFailure {
  success: false;
  error: string;
}

export type MhdCareerOneStopWageLookupResponse =
  | MhdCareerOneStopWageLookupSuccess
  | MhdCareerOneStopWageLookupFailure;

export type MhdCompensationReadiness = MhdComplianceReadiness;
