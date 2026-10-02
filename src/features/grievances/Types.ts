// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
// ---------------------------------------------------------------------------

export const MHD_GRIEVANCE_STATUSES = [
  'SUBMITTED',
  'ACKNOWLEDGED',
  'IN_REVIEW',
  'RESOLVED',
  'WITHDRAWN',
  'REFERRED',
  'REJECTED_NOT_GRIEVABLE',
] as const;
export type MhdGrievanceStatus = (typeof MHD_GRIEVANCE_STATUSES)[number];

export function mhdFormatGrievanceStatus(status: string): string {
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    ACKNOWLEDGED: 'Acknowledged',
    IN_REVIEW: 'In Review',
    RESOLVED: 'Resolved',
    WITHDRAWN: 'Withdrawn',
    REFERRED: 'Referred',
    REJECTED_NOT_GRIEVABLE: 'Rejected — Not Grievable',
  };
  return labels[status] ?? status;
}

/** Row shape returned by `mhd_grievance_list`. */
export interface MhdGrievanceListRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  status: string;
  is_harassment_related: boolean;
  submitted_at: string | null;
  acknowledged_at: string | null;
  referred_to_process: string | null;
  referred_at: string | null;
  resolution_at: string | null;
  closed_at: string | null;
}

/** Row shape returned by `mhd_grievance_list_mine`. */
export interface MhdMyGrievanceRpcRow {
  id: string;
  reference_id: string;
  status: string;
  submitted_at: string | null;
  acknowledged_at: string | null;
  referred_to_process: string | null;
  resolution_at: string | null;
  closed_at: string | null;
}

/** Row shape returned by `mhd_grievance_get`. */
export interface MhdGrievanceDetailRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  person_id: string;
  status: string;
  grievance_who: string | null;
  grievance_what: string | null;
  grievance_where: string | null;
  grievance_when: string | null;
  grievance_why: string | null;
  disagreement_explanation: string | null;
  remedy_requested: string | null;
  concerns_unrecorded_oral_reprimand: boolean;
  is_harassment_related: boolean;
  referred_to_process: string | null;
  /** Present only for someone who may view that investigation. */
  referred_to_investigation_id?: string | null;
  referred_at: string | null;
  submitted_at: string | null;
  employee_signature_name: string | null;
  employee_signature_at: string | null;
  acknowledged_at: string | null;
  resolution: string | null;
  resolution_at: string | null;
  closed_at: string | null;
}

/** Row shape returned by `mhd_grievance_list_steps`. */
export interface MhdGrievanceStepRpcRow {
  id: string;
  step_ordinal: number;
  step_name: string;
  handled_by: string | null;
  handled_by_name: string | null;
  handled_at: string | null;
  step_outcome: string | null;
  step_notes: string | null;
}

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdGrievanceListItem {
  id: string;
  referenceId: string;
  personId: string;
  personDisplayName: string;
  status: MhdGrievanceStatus;
  isHarassmentRelated: boolean;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  referredToProcess: string | null;
  referredAt: string | null;
  resolutionAt: string | null;
  closedAt: string | null;
}

export interface MhdMyGrievance {
  id: string;
  referenceId: string;
  status: MhdGrievanceStatus;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  referredToProcess: string | null;
  resolutionAt: string | null;
  closedAt: string | null;
}

export interface MhdGrievanceDetail {
  id: string;
  referenceId: string;
  companyId: string;
  personId: string;
  status: MhdGrievanceStatus;
  grievanceWho: string | null;
  grievanceWhat: string | null;
  grievanceWhere: string | null;
  grievanceWhen: string | null;
  grievanceWhy: string | null;
  disagreementExplanation: string | null;
  remedyRequested: string | null;
  concernsUnrecordedOralReprimand: boolean;
  isHarassmentRelated: boolean;
  referredToProcess: string | null;
  /** The investigation it was referred to; null unless the viewer may see that investigation. */
  referredToInvestigationId: string | null;
  referredAt: string | null;
  submittedAt: string | null;
  employeeSignatureName: string | null;
  employeeSignatureAt: string | null;
  acknowledgedAt: string | null;
  resolution: string | null;
  resolutionAt: string | null;
  closedAt: string | null;
}

export interface MhdGrievanceStep {
  id: string;
  stepOrdinal: number;
  stepName: string;
  handledBy: string | null;
  handledByName: string | null;
  handledAt: string | null;
  stepOutcome: string | null;
  stepNotes: string | null;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface MhdGrievanceListFilters {
  companyId: string | null;
  status?: MhdGrievanceStatus | null;
}

export interface MhdSubmitGrievanceInput {
  companyId: string;
  personId: string;
  grievanceWhat: string;
  disagreementExplanation: string;
  remedyRequested: string;
  employeeSignatureName: string;
  grievanceWho?: string | null;
  grievanceWhere?: string | null;
  grievanceWhen?: string | null;
  grievanceWhy?: string | null;
  isHarassmentRelated?: boolean;
}

export interface MhdAddGrievanceStepInput {
  grievanceId: string;
  stepOrdinal: number;
  stepName: string;
  stepOutcome?: string | null;
  stepNotes?: string | null;
  handledAt?: string | null;
}

export interface MhdReferGrievanceInput {
  grievanceId: string;
  referredToProcess: string;
  /** Links the referral to an investigation the caller can view (0363). */
  investigationCaseId?: string | null;
}

export interface MhdResolveGrievanceInput {
  grievanceId: string;
  resolution: string;
}

export interface MhdRejectGrievanceInput {
  grievanceId: string;
  reason: string;
}
