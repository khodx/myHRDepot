import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdDocumentService } from '@/features/documents/Service';
import type { MhdDocumentGenerationDetailRow } from '@/features/documents/Service';
import type { MhdDocumentMutationContext } from '@/features/documents/Types';
import type { MhdTask } from '@/features/tasks/Types';
import type {
  MhdAuditEvent,
  MhdAuditEventFilters,
  MhdAuditEventsRpcRow,
  MhdListAuditEventsParams,
  MhdTaskAuditEntry,
  MhdTaskAuditReportTimelineRow,
  MhdTaskAuditTimelineRpcRow,
} from './Types';

// supabaseClient.rpc is called directly rather than bound to a local alias,
// mirroring the documented Leaves Service pattern (src/features/leaves/Service.ts):
// binding instantiates the whole generated rpc overload set at once, which
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema
// size. A direct call instantiates only the matching overload.

const TASK_AUDIT_REPORT_TEMPLATE_KEY = 'TASK_AUDIT_REPORT';
// Company-wide report template (migration 0102_audit_access_and_report_template.sql),
// applicable_entity_type = null — not tied to a single module's entity.
const AUDIT_REPORT_TEMPLATE_KEY = 'AUDIT_REPORT';

// The Task Audit system report set (migration 0105_task_audit_system_reports.sql):
// three additional Task-scoped templates alongside the full TASK_AUDIT_REPORT
// (master). Each reuses the exact same mhd_get_task_audit_timeline data and
// {{#each audit.timeline}} mechanism — only which rows get passed as
// audit.timeline differs, filtered client-side per template_key below. No new
// RPC needed: same data, three additional lenses on it.
export const TASK_AUDIT_STATUS_HISTORY_REPORT_TEMPLATE_KEY = 'TASK_AUDIT_STATUS_HISTORY_REPORT';
export const TASK_AUDIT_FIELD_CHANGE_REPORT_TEMPLATE_KEY = 'TASK_AUDIT_FIELD_CHANGE_REPORT';
export const TASK_AUDIT_SECURITY_REPORT_TEMPLATE_KEY = 'TASK_AUDIT_SECURITY_REPORT';

/** Row filter per template_key. A template with no entry here (including the
 *  master TASK_AUDIT_REPORT and the company-wide AUDIT_REPORT) gets the full,
 *  unfiltered timeline — these three narrow it to one lens. */
const TASK_AUDIT_REPORT_ROW_FILTER: Record<string, (entry: MhdTaskAuditEntry) => boolean> = {
  [TASK_AUDIT_STATUS_HISTORY_REPORT_TEMPLATE_KEY]: (entry) =>
    entry.actionType.toUpperCase().includes('STATUS'),
  [TASK_AUDIT_FIELD_CHANGE_REPORT_TEMPLATE_KEY]: (entry) => Boolean(entry.fieldName),
  [TASK_AUDIT_SECURITY_REPORT_TEMPLATE_KEY]: (entry) =>
    Boolean(entry.ipAddress) || Boolean(entry.userAgent),
};

function mapAuditRow(row: MhdTaskAuditTimelineRpcRow): MhdTaskAuditEntry {
  return {
    id: row.id,
    entityType: row.entity_type as MhdTaskAuditEntry['entityType'],
    entityId: row.entity_id,
    actionType: row.action_type,
    fieldName: row.field_name ?? null,
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    summary: row.summary ?? null,
    performedBy: row.performed_by ?? null,
    performedByName: row.actor_name ?? null,
    performedAt: row.performed_at,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    sourceModule: row.source_module ?? null,
    metadata: row.metadata ?? null,
  };
}

function mapAuditEventRow(row: MhdAuditEventsRpcRow): MhdAuditEvent {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actionType: row.action_type,
    fieldName: row.field_name ?? null,
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    summary: row.summary ?? null,
    performedBy: row.performed_by ?? null,
    performedByName: row.actor_name ?? null,
    performedAt: row.performed_at,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    sourceModule: row.source_module ?? null,
    metadata: row.metadata ?? null,
  };
}

export const mhdAuditService = {
  /**
   * Ordered `performed_at desc` by the RPC. Raises 42501 (via
   * mhd_assert_task_audit_timeline_access) for anyone who is not Platform
   * Admin / HR Partner — this call is the actual enforcement; the route
   * guard and tab visibility are UX only.
   */
  async listTaskAuditTimeline(taskId: string): Promise<MhdTaskAuditEntry[]> {
    const { data, error } = await supabaseClient.rpc('mhd_get_task_audit_timeline', {
      p_task_id: taskId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdTaskAuditTimelineRpcRow[]).map(mapAuditRow);
  },

  /**
   * Requests a Task Audit report generation — the master TASK_AUDIT_REPORT by
   * default, or one of the system report set
   * (TASK_AUDIT_STATUS_HISTORY_REPORT / TASK_AUDIT_FIELD_CHANGE_REPORT /
   * TASK_AUDIT_SECURITY_REPORT) when templateKey is passed. Copies the
   * request/render/poll sequence from mhdDocumentService.generateAndPoll
   * exactly (see src/features/documents/Service.ts) — the addition is
   * building the `audit.*` merge_data by re-fetching the FULL timeline right
   * before generating, independent of whatever date/action/performer filters
   * are active on the page (a report is meant to be the complete record, not
   * whatever slice happens to be on screen), then applying
   * TASK_AUDIT_REPORT_ROW_FILTER for templateKey on top of that full fetch —
   * so "complete record" and "one filtered lens on the complete record" are
   * both honored, never a stale on-screen filter.
   */
  async requestTaskAuditReport(
    task: Pick<
      MhdTask,
      'id' | 'companyId' | 'referenceId' | 'title' | 'assignedDate' | 'startDate' | 'dueDate' | 'completedDate' | 'statusName'
    >,
    context: MhdDocumentMutationContext,
    generatedByDisplayName: string,
    templateKey: string = TASK_AUDIT_REPORT_TEMPLATE_KEY,
  ): Promise<MhdDocumentGenerationDetailRow> {
    const template = await mhdDocumentService.getTemplateByKey(templateKey, task.companyId);
    if (!template) {
      throw new Error(`No "${templateKey}" report template is available for this company.`);
    }

    const fullTimeline = await mhdAuditService.listTaskAuditTimeline(task.id);
    const rowFilter = TASK_AUDIT_REPORT_ROW_FILTER[templateKey];
    const timeline = rowFilter ? fullTimeline.filter(rowFilter) : fullTimeline;
    const timelineRows: MhdTaskAuditReportTimelineRow[] = timeline.map((entry) => ({
      performed_at: entry.performedAt,
      performed_by: entry.performedBy ?? '',
      action_type: entry.actionType,
      field_name: entry.fieldName ?? '',
      old_value: entry.oldValue ?? '',
      new_value: entry.newValue ?? '',
      ip_address: entry.ipAddress ?? '',
      user_agent: entry.userAgent ?? '',
      source_module: entry.sourceModule ?? '',
    }));
    // performed_at desc from the RPC, so the first row is latest and the last is first.
    const firstPerformedAt = timeline.length > 0 ? timeline[timeline.length - 1].performedAt : '';
    const latestPerformedAt = timeline.length > 0 ? timeline[0].performedAt : '';

    return mhdDocumentService.generateAndPoll(
      {
        templateId: template.id,
        companyId: task.companyId,
        entityType: 'TASK',
        entityId: task.id,
        mergeData: {
          'task.reference_id': task.referenceId,
          'task.title': task.title,
          'task.assigned_date': task.assignedDate,
          'task.start_date': task.startDate ?? '',
          'task.due_date': task.dueDate ?? '',
          'task.completed_date': task.completedDate ?? '',
          'task.status_name': task.statusName,
          'audit.total_entry_count': String(fullTimeline.length),
          'audit.displayed_entry_count': String(timeline.length),
          'audit.first_performed_at': firstPerformedAt,
          'audit.latest_performed_at': latestPerformedAt,
          'audit.timeline': timelineRows,
          'system.performed_by': generatedByDisplayName,
          'system.timestamp': new Date().toISOString(),
        },
      },
      context,
    );
  },

  /**
   * Company-wide audit events (mhd_list_audit_events). entityType/actionType
   * map to the RPC's p_entity_type/p_event_type params; date_from/date_to
   * pass straight through. Optional params are omitted (not passed as null)
   * so the RPC's own defaults apply, matching the pattern used throughout
   * this codebase (see mhdSearchNotes's optional p_company_id, above).
   * Restricted to Platform Admin / HR Partner — raises 42501 otherwise, same
   * enforcement style as listTaskAuditTimeline.
   */
  async listAuditEvents(params: MhdListAuditEventsParams): Promise<MhdAuditEvent[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_audit_events', {
      p_company_id: params.companyId,
      ...(params.entityType ? { p_entity_type: params.entityType } : {}),
      ...(params.actionType ? { p_event_type: params.actionType } : {}),
      ...(params.dateFrom ? { p_date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { p_date_to: params.dateTo } : {}),
      ...(params.limit !== undefined ? { p_limit: params.limit } : {}),
      ...(params.offset !== undefined ? { p_offset: params.offset } : {}),
    });
    if (error) throw error;
    return ((data ?? []) as MhdAuditEventsRpcRow[]).map(mapAuditEventRow);
  },

  /**
   * Requests an AUDIT_REPORT generation. Unlike requestTaskAuditReport (which
   * always re-fetches the FULL unfiltered task timeline, because a per-task
   * report is meant to be that task's complete record), this report is a
   * snapshot of the currently applied filters on the company-wide page — the
   * brief calls for `filters.*` merge data "reflecting the currently applied
   * filters", so the caller passes the already-fetched event set(s) rather
   * than this method re-querying.
   *
   * `allEvents` is the server-filtered set (entityType/actionType/date
   * params applied, before the page's client-side sourceModule filter);
   * `displayedEvents` is what's actually shown in the table (after
   * sourceModule filtering) and is what populates `audit.timeline`.
   */
  async requestAuditReport(
    companyId: string,
    filters: MhdAuditEventFilters,
    allEvents: MhdAuditEvent[],
    displayedEvents: MhdAuditEvent[],
    context: MhdDocumentMutationContext,
    generatedByDisplayName: string,
  ): Promise<MhdDocumentGenerationDetailRow> {
    const template = await mhdDocumentService.getTemplateByKey(AUDIT_REPORT_TEMPLATE_KEY, companyId);
    if (!template) {
      throw new Error(
        `No "${AUDIT_REPORT_TEMPLATE_KEY}" report template is available for this company.`,
      );
    }

    const timelineRows: MhdTaskAuditReportTimelineRow[] = displayedEvents.map((entry) => ({
      performed_at: entry.performedAt,
      performed_by: entry.performedByName ?? entry.performedBy ?? '',
      action_type: entry.actionType,
      field_name: entry.fieldName ?? '',
      old_value: entry.oldValue ?? '',
      new_value: entry.newValue ?? '',
      ip_address: entry.ipAddress ?? '',
      user_agent: entry.userAgent ?? '',
      source_module: entry.sourceModule ?? '',
    }));

    return mhdDocumentService.generateAndPoll(
      {
        templateId: template.id,
        companyId,
        // No single record backs a company-wide report; entityId is the
        // company itself so a generation row still has a stable, meaningful
        // (entity_type, entity_id) pair rather than an empty string.
        entityType: 'AUDIT_REPORT',
        entityId: companyId,
        mergeData: {
          'filters.date_from': filters.from,
          'filters.date_to': filters.to,
          'filters.entity_type': filters.entityType === 'ALL' ? '' : filters.entityType,
          'filters.action_type': filters.actionType === 'ALL' ? '' : filters.actionType,
          'filters.source_module': filters.sourceModule === 'ALL' ? '' : filters.sourceModule,
          // No performed-by filter exists on this page (out of scope per the
          // brief's filter list — date range/entity type/action
          // type/source module only), so this merge field is always blank.
          'filters.performed_by_name': '',
          'audit.total_entry_count': String(allEvents.length),
          'audit.displayed_entry_count': String(displayedEvents.length),
          'audit.timeline': timelineRows,
          'system.performed_by': generatedByDisplayName,
          'system.timestamp': new Date().toISOString(),
        },
      },
      context,
    );
  },
};
