// Frontend layer for Task Audit/History (Stage 3). The RPC
// (mhd_get_task_audit_timeline, migration added in the docs/Supabase repo's
// Stages 1-2, not here) merges a task's own audit trail with its linked
// notes/attachments/activities and is Platform Admin / HR Partner only —
// raises 42501 for anyone else. This module never re-derives that gate: the
// RPC is the enforcement, MHD_ROUTE_ACCESS + client-side hiding are only UX.

/** The polymorphic entity a timeline row actually describes — the task
 *  itself, or one of its linked notes/attachments/activities. */
export type MhdTaskAuditEntityType = 'TASK' | 'NOTE' | 'ATTACHMENT' | 'ACTIVITY';

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
