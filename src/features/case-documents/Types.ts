import type { Json } from '@/types/database.types';

export type MhdCaseDocumentSourceEntityType = 'CONDUCT_CASE' | 'INVESTIGATION_CASE';
export type MhdCaseDocumentKind = 'HR_ADVISORY_MEMO';
export type MhdCaseDocumentConfidentialityLevel = 'STANDARD' | 'HIGH' | 'RESTRICTED';
export type MhdCaseDocumentStatus = 'DRAFT' | 'GENERATION_REQUESTED' | 'GENERATED' | 'VOIDED';
export type MhdCaseDocumentGenerationStatus =
  'PENDING' | 'GENERATED' | 'FAILED' | 'SIGNED' | 'VOIDED';

export interface MhdHrAdvisoryMemoPayload {
  memo?: {
    date?: string | null;
    to?: string | null;
    from?: string | null;
    subject?: string | null;
  };
  company?: {
    name?: string | null;
  };
  subjectEmployee?: {
    displayName?: string | null;
    positionTitle?: string | null;
    departmentProgram?: string | null;
    dateOfHire?: string | null;
  };
  case?: {
    referenceId?: string | null;
  };
  purpose?: string | null;
  background?: string | null;
  documentedIncidents?: string | null;
  policyHandbookViolations?: string | null;
  stateLawConsiderations?: string | null;
  riskAssessment?: string | null;
  aggravatingFactors?: string | null;
  mitigatingFactors?: string | null;
  employmentOptions?: string | null;
  separationConsiderations?: string | null;
  advisorObservations?: string | null;
  preparedBy?: {
    name?: string | null;
    title?: string | null;
  };
}

export interface MhdCaseDocument {
  id: string;
  referenceId: string;
  companyId: string;
  sourceEntityType: MhdCaseDocumentSourceEntityType;
  sourceEntityId: string;
  documentKind: MhdCaseDocumentKind;
  title: string;
  confidentialityLevel: MhdCaseDocumentConfidentialityLevel;
  payload: Json;
  status: MhdCaseDocumentStatus;
  documentGenerationId: string | null;
  generationStatus: MhdCaseDocumentGenerationStatus | null;
  outputDriveFileId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface MhdCaseDocumentRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  source_entity_type: string;
  source_entity_id: string;
  document_kind: string;
  title: string;
  confidentiality_level: string;
  payload: Json;
  status: string;
  document_generation_id: string | null;
  generation_status: string | null;
  output_drive_file_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MhdCaseDocumentMutationRpcRow {
  id: string;
  reference_id: string;
  status: string;
  document_generation_id?: string | null;
}

export interface MhdCreateHrAdvisoryMemoInput {
  companyId: string;
  sourceEntityType: MhdCaseDocumentSourceEntityType;
  sourceEntityId: string;
  title: string;
  confidentialityLevel?: MhdCaseDocumentConfidentialityLevel;
  payload: MhdHrAdvisoryMemoPayload;
}

export interface MhdUpdateCaseDocumentInput {
  caseDocumentId: string;
  title?: string | null;
  confidentialityLevel?: MhdCaseDocumentConfidentialityLevel | null;
  payload?: MhdHrAdvisoryMemoPayload | null;
}

export interface MhdGeneratedCaseDocumentResult {
  id: string;
  referenceId: string;
  status: MhdCaseDocumentStatus;
  documentGenerationId: string;
  outputDriveFileId: string | null;
  outputDocumentHash: string | null;
}
