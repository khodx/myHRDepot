import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskWorkspaceNav } from '@/appshell/components/MhdTaskWorkspaceNav';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAuditEvents, useMhdRequestAuditReport } from '../Hook';
import type { MhdAuditEvent, MhdAuditEventFilters } from '../Types';
import { MHD_AUDIT_EVENT_DEFAULT_FILTERS } from '../Types';
import { MhdAuditReportPanel } from './MhdAuditReportPanel';
import { MhdAuditTimelineTable } from './MhdAuditTimelineTable';

// No narrower system report set exists company-wide yet (the system report
// set from migration 0105 is Task-module-scoped — see MhdTaskAuditPage) —
// this stays empty until/unless a company-wide equivalent is built.
const MHD_COMPANY_WIDE_AUDIT_SYSTEM_REPORT_KEYS: string[] = [];

/**
 * Route: /audit-reports
 * Platform Admin / HR Partner only — mhd_list_audit_events enforces this
 * server-side (42501 for anyone else, same as mhd_get_task_audit_timeline);
 * the route guard in mhdRouteAccess.ts and the sidebar's visibility are UX
 * only, not the actual access control.
 *
 * Company-wide counterpart to MhdTaskAuditPage. entityType/actionType/date
 * range are server-side filters (mhd_list_audit_events params); sourceModule
 * has no server param, so it is applied client-side against the fetched set.
 */
export function MhdAuditReportsPage() {
  const { profile, roles } = useMhdAuth();
  const [filters, setFilters] = useState<MhdAuditEventFilters>(MHD_AUDIT_EVENT_DEFAULT_FILTERS);
  const [rowNotice, setRowNotice] = useState<string | null>(null);

  const companyId = profile?.companyId ?? null;

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useMhdAuditEvents(companyId, {
    entityType: filters.entityType,
    actionType: filters.actionType,
    from: filters.from,
    to: filters.to,
  });

  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  const requestReport = useMhdRequestAuditReport(actorContext);

  // Option lists are derived from the currently loaded (server-filtered) set,
  // matching MhdTaskAuditPage's precedent for its Action Type/Performed By
  // selects — narrowing entityType/actionType server-side does mean these
  // lists can shrink after a selection is made; acceptable trade-off, same
  // as the per-task page.
  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const event of events ?? []) set.add(event.entityType);
    return Array.from(set).sort();
  }, [events]);

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    for (const event of events ?? []) set.add(event.actionType);
    return Array.from(set).sort();
  }, [events]);

  const sourceModules = useMemo(() => {
    const set = new Set<string>();
    for (const event of events ?? []) {
      if (event.sourceModule) set.add(event.sourceModule);
    }
    return Array.from(set).sort();
  }, [events]);

  const displayedEvents = useMemo(() => {
    return (events ?? []).filter((event) => {
      if (filters.sourceModule !== 'ALL' && event.sourceModule !== filters.sourceModule) return false;
      return true;
    });
  }, [events, filters.sourceModule]);

  // templateKey is unused today (only AUDIT_REPORT exists company-wide, no
  // system report set here yet — see MHD_COMPANY_WIDE_AUDIT_SYSTEM_REPORT_KEYS
  // above), but the panel's onGenerateTemplate contract always passes one.
  async function handleGenerateTemplate() {
    if (!companyId) return;
    const generatedByDisplayName = profile?.displayName ?? profile?.email ?? '';
    return requestReport.mutateAsync({
      companyId,
      filters,
      allEvents: events ?? [],
      displayedEvents,
      generatedByDisplayName,
    });
  }

  // Belt-and-suspenders: the route guard (mhdRouteAccess.ts) already keeps a
  // non-Platform-Admin/HR-Partner caller from reaching this route, and the
  // sidebar entry is hidden for them in MhdSidebar. This redirect covers a
  // stale bookmark or a role change mid-session — mirrors MhdTaskAuditPage.
  const canViewAudit = roles.includes('Platform Admin') || roles.includes('HR Partner');
  if (!canViewAudit) return <Navigate to="/404" replace />;

  // Which parent-task tab to point the user toward per entity type, when this
  // page has no parent-task lookup available (see resolveAuditRowLink.ts) —
  // entity_id here is the note/attachment/generation's own id, not a task
  // id, and no RPC resolves one to the other today.
  const MHD_UNRESOLVED_ROW_TARGET_TAB: Partial<Record<MhdAuditEvent['entityType'], string>> = {
    NOTE: 'Notes',
    ATTACHMENT: 'Attachments',
    DOCUMENT_GENERATION: 'Reports',
  };

  function handleUnresolvedRowClick(entry: MhdAuditEvent) {
    // The codebase has no toast system, so this surfaces as an inline
    // message near the table rather than a silent no-op or a broken link.
    const targetTab = MHD_UNRESOLVED_ROW_TARGET_TAB[entry.entityType] ?? 'relevant';
    setRowNotice(
      `This ${entry.entityType.toLowerCase()} entry can't be opened directly from here — open its parent task's ${targetTab} tab instead.`,
    );
  }

  return (
    <div className="space-y-6">
      <MhdTaskWorkspaceNav />

      <MhdPageHeader
        title="Audit Reports"
        description="Company-wide audit events across records and modules. Filter by date, entity, action, or source module before generating a report."
      />

      {companyId && (
        <MhdCard>
          <h2 className="text-sm font-semibold text-foreground">Reports</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Download a template to customize offline, generate directly from the current filtered
            audit data, or upload a finished document back.
          </p>
          <div className="mt-4">
            <MhdAuditReportPanel
              masterTemplateKey="AUDIT_REPORT"
              systemReportTemplateKeys={MHD_COMPANY_WIDE_AUDIT_SYSTEM_REPORT_KEYS}
              entityType="AUDIT_REPORT"
              entityId={companyId}
              companyId={companyId}
              onGenerateTemplate={handleGenerateTemplate}
            />
          </div>
        </MhdCard>
      )}

      {rowNotice && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>{rowNotice}</span>
          <button
            type="button"
            onClick={() => setRowNotice(null)}
            className="font-medium underline"
            data-row-click-ignore
          >
            Dismiss
          </button>
        </div>
      )}

      <MhdFilterBar onClear={() => setFilters(MHD_AUDIT_EVENT_DEFAULT_FILTERS)}>
        <MhdFilterInput
          type="date"
          label="From"
          value={filters.from}
          onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
        />
        <MhdFilterInput
          type="date"
          label="To"
          value={filters.to}
          onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
        />
        <MhdFilterSelect
          label="Entity Type"
          value={filters.entityType}
          onChange={(event) => setFilters((prev) => ({ ...prev, entityType: event.target.value }))}
        >
          <option value="ALL">All entities</option>
          {entityTypes.map((entityType) => (
            <option key={entityType} value={entityType}>
              {entityType}
            </option>
          ))}
        </MhdFilterSelect>
        <MhdFilterSelect
          label="Action Type"
          value={filters.actionType}
          onChange={(event) => setFilters((prev) => ({ ...prev, actionType: event.target.value }))}
        >
          <option value="ALL">All actions</option>
          {actionTypes.map((actionType) => (
            <option key={actionType} value={actionType}>
              {actionType}
            </option>
          ))}
        </MhdFilterSelect>
        <MhdFilterSelect
          label="Source Module"
          value={filters.sourceModule}
          onChange={(event) => setFilters((prev) => ({ ...prev, sourceModule: event.target.value }))}
        >
          <option value="ALL">All modules</option>
          {sourceModules.map((sourceModule) => (
            <option key={sourceModule} value={sourceModule}>
              {sourceModule}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      <MhdCard className="overflow-hidden p-0">
        {eventsLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading audit events...</p>
        ) : eventsError ? (
          <p className="p-4 text-sm text-red-700">
            {(eventsError as Error).message ?? 'Unable to load audit events.'}
          </p>
        ) : (
          // No linkContext.taskId here — this page isn't scoped to one task,
          // so NOTE/ATTACHMENT rows fall back to onUnresolvedRowClick.
          <MhdAuditTimelineTable
            entries={displayedEvents}
            emptyMessage="No audit events match the current filters."
            onUnresolvedRowClick={handleUnresolvedRowClick}
          />
        )}
      </MhdCard>
    </div>
  );
}
