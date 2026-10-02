// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
// ---------------------------------------------------------------------------

export const MHD_GRIEVANCE_STATUSES = [
  'DRAFT',
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
    DRAFT: 'Draft',
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

// ---------------------------------------------------------------------------
// Intake wizard (0372)
// ---------------------------------------------------------------------------

export const MHD_GRIEVANCE_CATEGORIES = [
  'PAY_AND_HOURS',
  'DISCIPLINE_OR_PERFORMANCE',
  'SCHEDULING_OR_LEAVE',
  'WORKING_CONDITIONS',
  'SUPERVISOR_CONDUCT',
  'COWORKER_CONDUCT',
  'POLICY_APPLICATION',
  'SAFETY',
  'OTHER',
] as const;
export type MhdGrievanceCategory = (typeof MHD_GRIEVANCE_CATEGORIES)[number];

export const MHD_GRIEVANCE_CATEGORY_LABELS: Record<MhdGrievanceCategory, string> = {
  PAY_AND_HOURS: 'Pay and hours',
  DISCIPLINE_OR_PERFORMANCE: 'Discipline or performance',
  SCHEDULING_OR_LEAVE: 'Scheduling or leave',
  WORKING_CONDITIONS: 'Working conditions',
  SUPERVISOR_CONDUCT: "A supervisor's conduct",
  COWORKER_CONDUCT: "A coworker's conduct",
  POLICY_APPLICATION: 'How a policy was applied',
  SAFETY: 'Safety',
  OTHER: 'Something else',
};

export interface MhdGrievanceWitnessInput {
  witnessName: string;
  witnessPersonId?: string | null;
  whatTheyKnow?: string | null;
}

export interface MhdGrievanceIntakeInput {
  companyId: string;
  personId: string;
  grievanceWhat: string;
  disagreementExplanation: string;
  remedyRequested: string;
  employeeSignatureName: string;
  grievanceCategory?: MhdGrievanceCategory | null;
  personGrievedAgainstId?: string | null;
  grievanceWho?: string | null;
  grievanceWhere?: string | null;
  /** ISO timestamp of the event. */
  grievanceWhen?: string | null;
  grievanceWhy?: string | null;
  stepsAlreadyTaken?: string | null;
  isHarassmentRelated: boolean;
  retaliationConcern: boolean;
  concernsUnrecordedOralReprimand: boolean;
  witnesses: MhdGrievanceWitnessInput[];
}

export interface MhdGrievanceIntakeResult {
  id: string;
  referenceId: string;
  status: MhdGrievanceStatus;
  referred: boolean;
}

export interface MhdGrievanceWitness {
  id: string;
  witnessName: string;
  witnessPersonId: string | null;
  whatTheyKnow: string | null;
}

/** What the intake captured beyond `mhd_grievance_get`'s fixed columns. */
export interface MhdGrievanceIntakeDetail {
  grievanceCategory: MhdGrievanceCategory | null;
  personGrievedAgainstId: string | null;
  personGrievedAgainstName: string | null;
  stepsAlreadyTaken: string | null;
  retaliationConcern: boolean;
  witnesses: MhdGrievanceWitness[];
}

export interface MhdRequestGrievanceSignatureInput {
  companyId: string;
  generationId: string;
  documentHash: string;
  /** The signed-in filer's user id; the receipt is signed in the app, not by an emailed link. */
  userId: string;
}
