import type { MhdCompanyId } from '@/features/companies/Types';
import type { Database } from '@/types/database.types';

type MhdOffboardingFunctions = Database['public']['Functions'];
export type MhdOffboardingCaseRpcRow =
  MhdOffboardingFunctions['mhd_list_offboarding_cases']['Returns'][number];
export type MhdOffboardingItemRpcRow =
  MhdOffboardingFunctions['mhd_list_offboarding_items']['Returns'][number];
export type MhdOffboardingMutationRpcRow =
  MhdOffboardingFunctions['mhd_create_offboarding_case']['Returns'][number];

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdOffboardingCaseId = string;
export type MhdOffboardingCaseReferenceId = `OFFC-${string}`;
export type MhdOffboardingItemId = string;
export type MhdOffboardingItemReferenceId = `OFCL-${string}`;

export type MhdSeparationType =
  'RESIGNATION' | 'TERMINATION' | 'LAYOFF' | 'END_OF_CONTRACT' | 'RETIREMENT' | 'OTHER';

export type MhdOffboardingCaseStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type MhdOffboardingItemStatus = 'PENDING' | 'COMPLETED' | 'WAIVED' | 'NOT_APPLICABLE';

export type MhdOffboardingLinkedEntityType =
  'PROPERTY_ASSIGNMENT' | 'DOCUMENT_GENERATION' | 'ESIGNATURE_REQUEST' | 'ACTIVITY' | 'TASK';

/** Seeded checklist item keys (inserted server-side by `mhd_create_offboarding_case`). */
export type MhdOffboardingSeededItemKey =
  | 'property_return'
  | 'exit_acknowledgment'
  | 'access_revocation'
  | 'final_pay'
  | 'exit_interview'
  | 'benefits_notice';

export const MHD_SEPARATION_TYPES = [
  'RESIGNATION',
  'TERMINATION',
  'LAYOFF',
  'END_OF_CONTRACT',
  'RETIREMENT',
  'OTHER',
] as const satisfies readonly MhdSeparationType[];

export const MHD_OFFBOARDING_CASE_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MhdOffboardingCaseStatus[];

export const MHD_CASE_STATUSES = MHD_OFFBOARDING_CASE_STATUSES;

export const MHD_OFFBOARDING_ITEM_STATUSES = [
  'PENDING',
  'COMPLETED',
  'WAIVED',
  'NOT_APPLICABLE',
] as const satisfies readonly MhdOffboardingItemStatus[];

export const MHD_OFFBOARDING_LINKED_ENTITY_TYPES = [
  'PROPERTY_ASSIGNMENT',
  'DOCUMENT_GENERATION',
  'ESIGNATURE_REQUEST',
  'ACTIVITY',
  'TASK',
] as const satisfies readonly MhdOffboardingLinkedEntityType[];

export const MHD_OFFBOARDING_SEEDED_ITEM_KEYS = [
  'property_return',
  'exit_acknowledgment',
  'access_revocation',
  'final_pay',
  'exit_interview',
  'benefits_notice',
] as const satisfies readonly MhdOffboardingSeededItemKey[];

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdOffboardingCase {
  id: MhdOffboardingCaseId;
  referenceId: MhdOffboardingCaseReferenceId;
  companyId: MhdCompanyId;
  companyName: string;
  personId: string;
  personDisplayName: string;
  personPrimaryEmail: string | null;
  initiatedByUserId: string;
  initiatorDisplayName: string;
  separationType: MhdSeparationType;
  status: MhdOffboardingCaseStatus;
  separationDate: string;
  lastWorkingDay: string | null;
  reasonSummary: string | null;
  eligibleForRehire: boolean | null;
  exitInterviewActivityId: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  requiredDoneCount: number;
  requiredTotalCount: number;
  outstandingPropertyCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MhdOffboardingChecklistItem {
  id: MhdOffboardingItemId;
  referenceId: MhdOffboardingItemReferenceId;
  caseId: MhdOffboardingCaseId;
  itemKey: MhdOffboardingSeededItemKey | null;
  title: string;
  description: string | null;
  isRequired: boolean;
  status: MhdOffboardingItemStatus;
  statusReason: string | null;
  assignedUserId: string | null;
  assigneeDisplayName: string | null;
  dueDate: string | null;
  linkedEntityType: MhdOffboardingLinkedEntityType | null;
  linkedEntityId: string | null;
  linkedEsignatureStatus: string | null;
  linkedDriveFileId: string | null;
  sortOrder: number;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface MhdCreateOffboardingCaseInput {
  companyId: MhdCompanyId;
  personId: string;
  separationType: MhdSeparationType;
  separationDate: string;
  lastWorkingDay?: string | null;
  reasonSummary?: string | null;
  actorUserId?: string | null;
}

export interface MhdUpdateOffboardingCaseInput {
  separationType?: MhdSeparationType;
  separationDate?: string;
  lastWorkingDay?: string | null;
  reasonSummary?: string | null;
  eligibleForRehire?: boolean | null;
  exitInterviewActivityId?: string | null;
}

export interface MhdTransitionOffboardingCaseInput {
  newStatus: MhdOffboardingCaseStatus;
  /** Required when transitioning to CANCELLED (separation rescinded) — RPC re-validates. */
  cancelReason?: string | null;
}

export interface MhdOffboardingCaseFilters {
  companyId: MhdCompanyId | 'ALL' | '';
  personId: string | 'ALL';
  separationType: MhdSeparationType | 'ALL';
  status: MhdOffboardingCaseStatus | 'ALL';
  searchTerm: string;
  from: string;
  to: string;
}

export type MhdOffboardingCaseBoardFilters = MhdOffboardingCaseFilters;

export interface MhdOffboardingOption {
  id: string;
  label: string;
}

export interface MhdCreateOffboardingItemInput {
  caseId: MhdOffboardingCaseId;
  title: string;
  description?: string | null;
  isRequired?: boolean;
  dueDate?: string | null;
  assignedUserId?: string | null;
  sortOrder?: number;
}

export interface MhdUpdateOffboardingItemInput {
  title?: string;
  description?: string | null;
  isRequired?: boolean;
  dueDate?: string | null;
  assignedUserId?: string | null;
  sortOrder?: number;
  status?: MhdOffboardingItemStatus;
  /** Waiver / not-applicable justification — required by the RPC for WAIVED / NOT_APPLICABLE. */
  reason?: string | null;
  linkedEntityType?: MhdOffboardingLinkedEntityType | null;
  linkedEntityId?: string | null;
}

export interface MhdGenerateExitDocumentInput {
  caseId: MhdOffboardingCaseId;
  /**
   * Optional pin to a specific document template. When omitted, the Service
   * resolves the seeded global "Exit Acknowledgment" template via
   * `mhd_get_exit_acknowledgment_template_id` (published lookup RPC).
   */
  templateId?: string;
  /**
   * Manual fallback for the document hash. Normally the 04.8 auto-hash stamp
   * (`document_generations.output_document_hash`) is used; this is only read
   * when the stamp is absent.
   */
  manualDocumentHash?: string | null;
  expiresAt?: string | null;
  actorUserId?: string | null;
  /** Poll tuning for the generation status check (test seam; defaults apply in production). */
  pollAttempts?: number;
  pollIntervalMs?: number;
  /** UI-only progress callback; no progress state is persisted client-side. */
  onStep?: (stepNumber: number) => void;
}

export interface MhdGenerateExitDocumentResult {
  case: MhdOffboardingCase;
  documentGenerationId: string;
  esignatureRequestId: string;
  documentHash: string;
  /** Non-fatal signer invitation delivery failures surfaced by the E-Signature composer. */
  invitationErrors: string[];
}

/** Step state consumed by the exit-document ceremony launcher (step progress UI). */
export interface MhdExitCeremonyStepState {
  key: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function mhdFormatSeparationType(separationType: MhdSeparationType): string {
  const labels: Record<MhdSeparationType, string> = {
    RESIGNATION: 'Resignation',
    TERMINATION: 'Termination',
    LAYOFF: 'Layoff',
    END_OF_CONTRACT: 'End of Contract',
    RETIREMENT: 'Retirement',
    OTHER: 'Other',
  };

  return labels[separationType];
}

export function mhdFormatOffboardingCaseStatus(status: MhdOffboardingCaseStatus): string {
  const labels: Record<MhdOffboardingCaseStatus, string> = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  return labels[status];
}

export const mhdFormatCaseStatus = mhdFormatOffboardingCaseStatus;

export function mhdFormatOffboardingItemStatus(status: MhdOffboardingItemStatus): string {
  const labels: Record<MhdOffboardingItemStatus, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    WAIVED: 'Waived',
    NOT_APPLICABLE: 'Not Applicable',
  };

  return labels[status];
}

export const mhdFormatItemStatus = mhdFormatOffboardingItemStatus;

export function mhdFormatEvidenceLinkType(type: MhdOffboardingLinkedEntityType): string {
  const labels: Record<MhdOffboardingLinkedEntityType, string> = {
    PROPERTY_ASSIGNMENT: 'Property assignment',
    DOCUMENT_GENERATION: 'Generated document',
    ESIGNATURE_REQUEST: 'Signature request',
    ACTIVITY: 'Activity',
    TASK: 'Task',
  };
  return labels[type];
}

export function mhdBuildEvidenceLinkHref(
  item: Pick<
    MhdOffboardingChecklistItem,
    'linkedEntityType' | 'linkedEntityId' | 'linkedDriveFileId'
  >,
): { href: string; external: boolean } | null {
  if (!item.linkedEntityType || !item.linkedEntityId) return null;
  if (item.linkedEntityType === 'PROPERTY_ASSIGNMENT') {
    return { href: '/property', external: false };
  }
  if (item.linkedEntityType === 'DOCUMENT_GENERATION') {
    return item.linkedDriveFileId
      ? {
          href: `https://drive.google.com/file/d/${encodeURIComponent(item.linkedDriveFileId)}/view`,
          external: true,
        }
      : null;
  }
  if (item.linkedEntityType === 'ESIGNATURE_REQUEST') {
    return { href: `/esignature/${item.linkedEntityId}`, external: false };
  }
  if (item.linkedEntityType === 'ACTIVITY') {
    return { href: `/activities/${item.linkedEntityId}`, external: false };
  }
  return { href: `/tasks/${item.linkedEntityId}`, external: false };
}

/** Overdue = the last working day has passed while the case is still ACTIVE. */
export function mhdIsOffboardingCaseOverdue(
  offboardingCase: Pick<MhdOffboardingCase, 'status' | 'lastWorkingDay'>,
): boolean {
  return (
    offboardingCase.status === 'ACTIVE' &&
    !!offboardingCase.lastWorkingDay &&
    new Date(`${offboardingCase.lastWorkingDay}T23:59:59.999Z`).getTime() < Date.now()
  );
}
