// Frontend layer for Task Audit/History (Stage 3). The RPC
// (mhd_get_task_audit_timeline, migration added in the docs/Supabase repo's
// Stages 1-2, not here) merges a task's own audit trail with its linked
// notes/attachments/activities and is Platform Admin / HR Partner only —
// raises 42501 for anyone else. This module never re-derives that gate: the
// RPC is the enforcement, MHD_ROUTE_ACCESS + client-side hiding are only UX.

/** The polymorphic entity a timeline row actually describes — the task
 *  itself, or one of its linked notes/attachments/activities. */
export type MhdTaskAuditEntityType =
  'TASK' | 'NOTE' | 'ATTACHMENT' | 'ACTIVITY' | 'SUBTASK' | 'DOCUMENT_GENERATION';

/** Raw RPC row shape (mhd_get_task_audit_timeline), per the generated
 *  Database['public']['Functions'] Returns type. The generator marks every
 *  column non-nullable, but several genuinely come back NULL at runtime
 *  (e.g. field_name/old_value/new_value on a non-field-change event,
 *  ip_address/user_agent when the actor wasn't an interactive browser
 *  session) — MhdTaskAuditEntry below models those honestly. */
export interface MhdTaskAuditTimelineRpcRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  summary: string;
  performed_by: string;
  actor_name: string;
  performed_at: string;
  ip_address: string;
  user_agent: string;
  source_module: string;
  metadata: unknown;
}

/** Retention disposition lifecycle (migration 0376). Nothing is ever deleted
 *  by the app: APPROVED_FOR_DISPOSAL only records approval, DISPOSED records
 *  that the purge was carried out elsewhere. */
export const MHD_RETENTION_DISPOSITION_STATUSES = [
  'PENDING_REVIEW',
  'EXTENDED',
  'LEGAL_HOLD',
  'APPROVED_FOR_DISPOSAL',
  'DISPOSED',
] as const;
export type MhdRetentionDispositionStatus = (typeof MHD_RETENTION_DISPOSITION_STATUSES)[number];

export const MHD_RETENTION_DECISIONS = [
  'EXTEND',
  'HOLD',
  'RELEASE_HOLD',
  'APPROVE_DISPOSAL',
  'CONFIRM_DISPOSED',
] as const;
export type MhdRetentionDecision = (typeof MHD_RETENTION_DECISIONS)[number];

export type MhdRetentionReviewScope = 'awaiting' | 'all';

/** Row shape returned by `mhd_retention_review_list`. The generator marks
 *  every column non-nullable; the nullable ones below genuinely are. */
export interface MhdRetentionReviewRpcRow {
  schedule_id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  person_id: string | null;
  person_name: string | null;
  retention_basis: string;
  retention_expires_at: string;
  effective_expires_at: string;
  computed_at: string;
  disposition_status: string;
  extended_until: string | null;
  hold_reference: string | null;
  decided_at: string | null;
  decided_by_name: string | null;
  decision_reason: string | null;
  awaiting_review: boolean;
  blocked_reason: string | null;
}

export interface MhdRetentionReviewItem {
  scheduleId: string;
  companyId: string;
  entityType: string;
  entityId: string;
  personId: string | null;
  personName: string | null;
  retentionBasis: string;
  retentionExpiresAt: string;
  effectiveExpiresAt: string;
  computedAt: string;
  dispositionStatus: MhdRetentionDispositionStatus;
  extendedUntil: string | null;
  holdReference: string | null;
  decidedAt: string | null;
  decidedByName: string | null;
  decisionReason: string | null;
  awaitingReview: boolean;
  /** Set when an open investigation / unresolved grievance forbids disposal. */
  blockedReason: string | null;
}

/** Row shape returned by `mhd_retention_decision_history`. */
export interface MhdRetentionHistoryRpcRow {
  event_id: string;
  decision: string;
  from_status: string | null;
  to_status: string;
  reason: string;
  effective_expiry_before: string | null;
  extended_until: string | null;
  actor_email: string | null;
  created_at: string;
}

export interface MhdRetentionHistoryEvent {
  eventId: string;
  decision: MhdRetentionDecision;
  fromStatus: MhdRetentionDispositionStatus | null;
  toStatus: MhdRetentionDispositionStatus;
  reason: string;
  effectiveExpiryBefore: string | null;
  extendedUntil: string | null;
  actorEmail: string | null;
  createdAt: string;
}

export interface MhdRecordRetentionDecisionInput {
  scheduleId: string;
  decision: MhdRetentionDecision;
  reason: string;
  /** ISO date (YYYY-MM-DD); required for EXTEND, ignored otherwise. */
  extendUntil?: string | null;
}

export interface MhdTaskAuditEntry {
  id: string;
  entityType: MhdTaskAuditEntityType;
  entityId: string;
  actionType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  summary: string | null;
  /** Actor id (auth user). See performedByName for the resolved display
   *  name — mhd_get_task_audit_timeline (migration 0103) joins users ->
   *  people the same way mhd_list_audit_events does. */
  performedBy: string | null;
  /** Resolved display name (users -> people join), falls back to 'System'
   *  server-side when there's no linked person. Falls back to the raw
   *  performedBy id client-side only if this is ever unset. */
  performedByName: string | null;
  performedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sourceModule: string | null;
  metadata: unknown;
}

export interface MhdTaskAuditFilters {
  from: string;
  to: string;
  actionType: string;
  performedBy: string;
  entityType: MhdTaskAuditEntityType | 'ALL';
}

export const MHD_TASK_AUDIT_DEFAULT_FILTERS: MhdTaskAuditFilters = {
  from: '',
  to: '',
  actionType: 'ALL',
  performedBy: '',
  entityType: 'ALL',
};

/** Fields the TASK_AUDIT_REPORT template's `{{#each audit.timeline}}` block
 *  reads (Timeline Entries table) — matches the template content verbatim.
 *  Also reused by the company-wide AUDIT_REPORT template, which repeats the
 *  same `{{#each audit.timeline}}` mechanism (see AUDIT_REPORT_TEMPLATE_KEY
 *  in Service.ts). */
export interface MhdTaskAuditReportTimelineRow {
  performed_at: string;
  performed_by: string;
  action_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  ip_address: string;
  user_agent: string;
  source_module: string;
}

// ---------------------------------------------------------------------------
// Company-wide Audit Reports (mhd_list_audit_events, migration
// 0102_audit_access_and_report_template.sql). Same access gate as the
// per-task timeline (Platform Admin / HR Partner, 42501 otherwise) but not
// scoped to a single task — it is the read path behind the /audit-reports
// page and the AUDIT_REPORT document template.
// ---------------------------------------------------------------------------

/** Raw RPC row shape (mhd_list_audit_events), per the generated
 *  Database['public']['Functions'] Returns type. As with the task-timeline
 *  RPC, several columns are nullable at runtime despite the generator
 *  marking every column non-nullable. */
export interface MhdAuditEventsRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  field_name: string;
  old_value: string;
  new_value: string;
  summary: string;
  metadata: unknown;
  performed_by: string;
  actor_name: string;
  performed_at: string;
  ip_address: string;
  user_agent: string;
  source_module: string;
}

export interface MhdAuditEvent {
  id: string;
  referenceId: string;
  companyId: string;
  entityType: string;
  entityId: string;
  actionType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  summary: string | null;
  performedBy: string | null;
  /** Display name join the company-wide RPC provides that the per-task RPC
   *  does not — falls back to the raw performedBy id when unavailable. */
  performedByName: string | null;
  performedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sourceModule: string | null;
  metadata: unknown;
}

/** Server-side params mhd_list_audit_events actually supports
 *  (p_entity_type / p_event_type / p_date_from / p_date_to). Source module
 *  has no server param — it is filtered client-side in MhdAuditReportsPage. */
export interface MhdListAuditEventsParams {
  companyId: string;
  entityType?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/** Page-level filter state for MhdAuditReportsPage. `entityType`/`actionType`/
 *  `from`/`to` drive the server-side RPC params; `sourceModule` is applied
 *  client-side against the already-fetched result set. */
export interface MhdAuditEventFilters {
  from: string;
  to: string;
  entityType: string;
  actionType: string;
  sourceModule: string;
}

export const MHD_AUDIT_EVENT_DEFAULT_FILTERS: MhdAuditEventFilters = {
  from: '',
  to: '',
  entityType: 'ALL',
  actionType: 'ALL',
  sourceModule: 'ALL',
};
