import type { Json } from '@/types/database.types';
import type { MhdCompanyId } from '@/features/companies/Types';

// ---------------------------------------------------------------------------
// RPC row shapes (local snake_case interfaces)
//
// Deliberately hand-maintained, not generated (checked 2026-08-06, migration
// 0036 has long since shipped): gen:types marks every column on a
// table-returning RPC function as non-null regardless of the underlying
// table's real schema. conduct_actions.action_summary / esignature_request_id
// / issued_at / acknowledgment_type / outcome_reason are genuinely nullable
// at the DB level (verified via \d public.conduct_actions) — adopting the
// generated type here would silently drop that nullability and let a null
// value reach code that assumes it's always present.
// ---------------------------------------------------------------------------

/** Row shape returned by `mhd_conduct_list_cases` (also the source for `get`). */
export interface MhdConductCaseRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  person_display_name: string;
  category: string;
  status: string;
  /** Total actions on the case (derived, never stored). */
  action_count: number | string;
  /** Actions in a terminal outcome — ACKNOWLEDGED / REFUSED / WAIVED (derived). */
  terminal_count: number | string;
  created_at: string;
}

/** Row shape returned by `mhd_conduct_list_actions`. */
export interface MhdConductActionRpcRow {
  id: string;
  reference_id: string;
  severity: string;
  status: string;
  action_summary: string | null;
  document_payload: Json | null;
  requires_document: boolean;
  esignature_request_id: string | null;
  /** Live cross-service read of the linked request's status (E-Signature contract). */
  esignature_status: string | null;
  acknowledgment_type: string | null;
  outcome_reason: string | null;
  issued_at: string | null;
  sort_order: number | string;
}

/** Row shape returned by the create/open RPCs: `(id, reference_id)`. */
export interface MhdConductMutationRpcRow {
  id: string;
  reference_id: string;
}

// ---------------------------------------------------------------------------
// Ids and vocabularies
// ---------------------------------------------------------------------------

export type MhdConductCaseId = string;
export type MhdConductCaseReferenceId = `COND-${string}`;
export type MhdConductActionId = string;
export type MhdConductActionReferenceId = `CACT-${string}`;

export type MhdConductCategory =
  'ATTENDANCE' | 'PERFORMANCE' | 'CONDUCT' | 'POLICY' | 'SAFETY' | 'OTHER';

export type MhdConductCaseStatus = 'OPEN' | 'CLOSED' | 'RESCINDED';

export type MhdConductSeverity =
  'VERBAL_WARNING' | 'WRITTEN_WARNING' | 'FINAL_WARNING' | 'MOU' | 'OTHER';

export type MhdConductActionStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'REFUSED' | 'WAIVED';

/**
 * The recordable terminal outcomes of an ISSUED action. ACKNOWLEDGED is gated
 * on the signature request completing; REFUSED and WAIVED each require a reason
 * (REFUSED also accepts a witness). These are the three ends of the ladder — an
 * action never returns to DRAFT once issued.
 */
export type MhdConductActionOutcome = 'ACKNOWLEDGED' | 'REFUSED' | 'WAIVED';

/**
 * Acknowledgment is RECEIPT, never AGREEMENT. The column is CHECK-constrained
 * to RECEIPT in v1 — a signed corrective-action document records that the
 * employee *received* it, not that they *agree* with it. Conflating the two is
 * a labour-relations hazard; there is deliberately no assent path in v1.
 */
export type MhdConductAcknowledgmentType = 'RECEIPT';

/**
 * Structured draft content for source-faithful corrective-action documents.
 * Conduct owns this payload because it is legal-record content, not merely a
 * Forms submission. Forms can capture it, but the issued action freezes it.
 */
export interface MhdConductActionDocumentPayload {
  companyName?: string | null;
  positionTitle?: string | null;
  departmentProgram?: string | null;
  supervisorName?: string | null;
  facilityLocation?: string | null;
  dateOfHire?: string | null;
  dateOfNotice?: string | null;
  incidentDates?: string | null;
  incidentTime?: string | null;
  incidentLocation?: string | null;
  policiesViolated?: string | null;
  previouslyAddressed?: string | null;
  incidentNarrative?: string | null;
  incidentFindings?: string | null;
  policyCitationText?: string | null;
  priorCorrectiveActionSummary?: string | null;
  trainingItems?: string | null;
  trainingDeadline?: string | null;
  followUpReviewDate?: string | null;
  expectations?: string | null;
  consequencesText?: string | null;
  extenuatingCircumstancesConsidered?: string | null;
  extenuatingCircumstancesExplanation?: string | null;
}

export const MHD_CONDUCT_CATEGORIES = [
  'ATTENDANCE',
  'PERFORMANCE',
  'CONDUCT',
  'POLICY',
  'SAFETY',
  'OTHER',
] as const satisfies readonly MhdConductCategory[];

export const MHD_CONDUCT_CASE_STATUSES = [
  'OPEN',
  'CLOSED',
  'RESCINDED',
] as const satisfies readonly MhdConductCaseStatus[];

export const MHD_CONDUCT_SEVERITIES = [
  'VERBAL_WARNING',
  'WRITTEN_WARNING',
  'FINAL_WARNING',
  'MOU',
  'OTHER',
] as const satisfies readonly MhdConductSeverity[];

export const MHD_CONDUCT_ACTION_STATUSES = [
  'DRAFT',
  'ISSUED',
  'ACKNOWLEDGED',
  'REFUSED',
  'WAIVED',
] as const satisfies readonly MhdConductActionStatus[];

export const MHD_CONDUCT_ACTION_OUTCOMES = [
  'ACKNOWLEDGED',
  'REFUSED',
  'WAIVED',
] as const satisfies readonly MhdConductActionOutcome[];

// ---------------------------------------------------------------------------
// Numeric normalisation
//
// The counting/ordering columns come back as `number | string` depending on
// the PostgREST numeric coercion path (bigint aggregates arrive as strings).
// Every mapping funnels those through mhdToNumber so the domain model is always
// a real `number` — never a string that silently breaks arithmetic or sort.
// ---------------------------------------------------------------------------

export function mhdToNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ---------------------------------------------------------------------------
// Domain models (camelCase)
// ---------------------------------------------------------------------------

export interface MhdConductCase {
  id: MhdConductCaseId;
  referenceId: MhdConductCaseReferenceId;
  personId: string;
  personDisplayName: string;
  category: MhdConductCategory;
  status: MhdConductCaseStatus;
  /** Derived count of all actions on the case. */
  actionCount: number;
  /** Derived count of actions in a terminal outcome. */
  terminalCount: number;
  createdAt: string;
}

export interface MhdConductAction {
  id: MhdConductActionId;
  referenceId: MhdConductActionReferenceId;
  severity: MhdConductSeverity;
  status: MhdConductActionStatus;
  actionSummary: string | null;
  documentPayload: MhdConductActionDocumentPayload;
  requiresDocument: boolean;
  esignatureRequestId: string | null;
  /** Live status of the linked signature request (read, never stored). */
  esignatureStatus: string | null;
  acknowledgmentType: MhdConductAcknowledgmentType | null;
  outcomeReason: string | null;
  issuedAt: string | null;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface MhdCreateConductCaseInput {
  companyId: MhdCompanyId;
  personId: string;
  category: MhdConductCategory;
  concernSummary?: string | null;
}

export interface MhdTransitionConductCaseInput {
  newStatus: MhdConductCaseStatus;
  /** Required when transitioning to RESCINDED (a discipline decision reversed) — RPC re-validates. */
  rescindReason?: string | null;
}

export interface MhdCreateConductActionInput {
  caseId: MhdConductCaseId;
  severity: MhdConductSeverity;
  actionSummary?: string | null;
  documentPayload?: MhdConductActionDocumentPayload | null;
  requiresDocument?: boolean;
}

export interface MhdUpdateConductActionInput {
  severity?: MhdConductSeverity;
  actionSummary?: string | null;
  documentPayload?: MhdConductActionDocumentPayload | null;
}

export interface MhdRecordConductOutcomeInput {
  outcome: MhdConductActionOutcome;
  /** Required for REFUSED and WAIVED; ignored for ACKNOWLEDGED (the RPC stamps RECEIPT). */
  reason?: string | null;
  /** Optional witness to a refusal; only meaningful on REFUSED. */
  witnessUserId?: string | null;
}

export interface MhdConductCaseFilters {
  companyId: MhdCompanyId;
  personId: string | 'ALL';
  category: MhdConductCategory | 'ALL';
  status: MhdConductCaseStatus | 'ALL';
  searchTerm: string;
}

/**
 * Input to the corrective-action document ceremony (the issue-action flow).
 * Mirrors Offboarding's exit-document ceremony: for an action that
 * `requiresDocument`, the Service resolves the template by severity, renders it,
 * verifies the hash, creates the signature request with the subject as the sole
 * external signer, and finally issues the action with the soft links. For an
 * action that does not require a document the ceremony short-circuits to a bare
 * `issue_action`.
 */
export interface MhdIssueConductActionInput {
  actionId: MhdConductActionId;
  caseId: MhdConductCaseId;
  companyId: MhdCompanyId;
  /** The subject employee — the external signer target for the ceremony. */
  personId: string;
  severity: MhdConductSeverity;
  requiresDocument: boolean;
  actionSummary?: string | null;
  documentPayload?: MhdConductActionDocumentPayload | null;
  /** Case reference id, folded into the document merge data for traceability. */
  caseReferenceId?: string | null;
  /**
   * Optional pin to a specific document template. When omitted, the Service
   * resolves the seeded corrective-action template for the severity via the
   * server-side key resolver (`mhd_get_corrective_action_template_id`).
   */
  templateId?: string;
  /** Manual fallback for the document hash when the 04.8 auto-stamp is absent. */
  manualDocumentHash?: string | null;
  expiresAt?: string | null;
  actorUserId?: string | null;
  /** Poll tuning for the generation status check (test seam; defaults apply in production). */
  pollAttempts?: number;
  pollIntervalMs?: number;
  /** UI-only progress callback; no progress state is persisted client-side. */
  onStep?: (stepNumber: number) => void;
}

export interface MhdIssueConductActionResult {
  actionId: MhdConductActionId;
  /** Null when the action did not require a document. */
  documentGenerationId: string | null;
  esignatureRequestId: string | null;
  documentHash: string | null;
  /** Non-fatal signer invitation delivery failures surfaced by the E-Signature composer. */
  invitationErrors: string[];
}

/** Step state consumed by the corrective-action ceremony launcher (step progress UI). */
export interface MhdConductCeremonyStepState {
  key: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function mhdFormatConductCategory(category: MhdConductCategory): string {
  const labels: Record<MhdConductCategory, string> = {
    ATTENDANCE: 'Attendance',
    PERFORMANCE: 'Performance',
    CONDUCT: 'Conduct',
    POLICY: 'Policy',
    SAFETY: 'Safety',
    OTHER: 'Other',
  };

  return labels[category];
}

export function mhdFormatConductCaseStatus(status: MhdConductCaseStatus): string {
  const labels: Record<MhdConductCaseStatus, string> = {
    OPEN: 'Open',
    CLOSED: 'Closed',
    RESCINDED: 'Rescinded',
  };

  return labels[status];
}

export function mhdFormatConductSeverity(severity: MhdConductSeverity): string {
  const labels: Record<MhdConductSeverity, string> = {
    VERBAL_WARNING: 'Verbal Warning',
    WRITTEN_WARNING: 'Written Warning',
    FINAL_WARNING: 'Final Written Warning',
    MOU: 'Memorandum of Understanding',
    OTHER: 'Other',
  };

  return labels[severity];
}

export function mhdFormatConductActionStatus(status: MhdConductActionStatus): string {
  const labels: Record<MhdConductActionStatus, string> = {
    DRAFT: 'Draft',
    ISSUED: 'Issued',
    // "Acknowledged" here always means acknowledged as RECEIVED — never agreed.
    ACKNOWLEDGED: 'Acknowledged (Receipt)',
    REFUSED: 'Refused',
    WAIVED: 'Waived',
  };

  return labels[status];
}

/** A case can be closed only once every action is in a terminal outcome (RPC re-checks). */
export function mhdIsConductCaseCloseable(
  conductCase: Pick<MhdConductCase, 'status' | 'actionCount' | 'terminalCount'>,
): boolean {
  return conductCase.status === 'OPEN' && conductCase.actionCount === conductCase.terminalCount;
}
