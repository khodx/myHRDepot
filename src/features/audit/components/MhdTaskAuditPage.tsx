import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '@/features/tasks/Service';
import { useMhdRequestTaskAuditReport, useMhdTaskAuditTimeline } from '../Hook';
import type { MhdTaskAuditEntityType, MhdTaskAuditFilters } from '../Types';
import { MHD_TASK_AUDIT_DEFAULT_FILTERS } from '../Types';

const MHD_TASK_AUDIT_ENTITY_TYPES: MhdTaskAuditEntityType[] = [
  'TASK',
  'NOTE',
  'ATTACHMENT',
  'ACTIVITY',
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/**
 * Route: /tasks/:taskId/audit
 * Platform Admin / HR Partner only — the RPC (mhd_get_task_audit_timeline)
 * enforces this server-side (42501 for anyone else); the route guard in
 * mhdRouteAccess.ts and the tab's client-side visibility in
 * MhdTaskRecordTabs are UX only, not the actual access control.
 */
export function MhdTaskAuditPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { profile, roles } = useMhdAuth();
  const [filters, setFilters] = useState<MhdTaskAuditFilters>(MHD_TASK_AUDIT_DEFAULT_FILTERS);
  const [reportError, setReportError] = useState<string | null>(null);

  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
  } = useQuery({
    queryKey: ['mhd-task', taskId],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useMhdTaskAuditTimeline(taskId ?? null);

  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  const requestReport = useMhdRequestTaskAuditReport(actorContext);

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    for (const entry of timeline ?? []) set.add(entry.actionType);
    return Array.from(set).sort();
  }, [timeline]);

  const performers = useMemo(() => {
    const set = new Set<string>();
    for (const entry of timeline ?? []) {
      if (entry.performedBy) set.add(entry.performedBy);
    }
    return Array.from(set).sort();
  }, [timeline]);

  const filteredEntries = useMemo(() => {
    return (timeline ?? []).filter((entry) => {
      if (filters.entityType !== 'ALL' && entry.entityType !== filters.entityType) return false;
      if (filters.actionType !== 'ALL' && entry.actionType !== filters.actionType) return false;
      if (filters.performedBy && entry.performedBy !== filters.performedBy) return false;
      if (filters.from && entry.performedAt < filters.from) return false;
      // Half-open on the "to" side isn't needed here: performedAt is a full
      // timestamp and filters.to is a bare date, so append the end-of-day
      // boundary to make the "To" filter inclusive of that whole day.
      if (filters.to && entry.performedAt > `${filters.to}T23:59:59.999Z`) return false;
      return true;
    });
  }, [timeline, filters]);

  async function handleGenerateReport() {
    if (!task) return;
    setReportError(null);
    try {
      const generatedByDisplayName = profile?.displayName ?? profile?.email ?? '';
      const generation = await requestReport.mutateAsync({ task, generatedByDisplayName });
      if (generation.status === 'FAILED') {
        setReportError('Report generation failed — see below for details.');
      }
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Unable to generate audit report.');
    }
  }

  if (!taskId) return <Navigate to="/tasks" replace />;

  // Belt-and-suspenders: the route guard (mhdRouteAccess.ts) already keeps a
  // non-Platform-Admin/HR-Partner caller from reaching this route, and the
  // tab itself is hidden for them in MhdTaskRecordTabs. This redirect covers
  // a stale bookmark or a role change mid-session.
  const canViewAudit = roles.includes('Platform Admin') || roles.includes('HR Partner');
  if (!canViewAudit) return <Navigate to="/404" replace />;

  const generation = requestReport.data;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/tasks/${taskId}`}
        backLabel="Task"
        title="Task Audit"
        actions={
          <Button
            type="button"
            disabled={!task || requestReport.isPending}
            onClick={() => void handleGenerateReport()}
          >
            {requestReport.isPending ? 'Generating…' : 'Generate Report'}
          </Button>
        }
      />

      <MhdTaskRecordTabs taskId={taskId} active="audit" />

      {taskLoading ? (
        <p className="text-sm text-muted-foreground">Loading task...</p>
      ) : taskError || !task ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(taskError as Error)?.message ?? 'Task not found'}
        </p>
      ) : null}

      {reportError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {reportError}
        </div>
      )}

      {generation && generation.status !== 'FAILED' && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <span>
            {generation.status === 'PENDING'
              ? 'Report is still generating…'
              : 'Audit report generated.'}
          </span>
          {generation.output_drive_file_id ? (
            <a
              href={`https://drive.google.com/file/d/${generation.output_drive_file_id}/view`}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline"
            >
              Download
            </a>
          ) : null}
        </div>
      )}

      <MhdFilterBar onClear={() => setFilters(MHD_TASK_AUDIT_DEFAULT_FILTERS)}>
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
          label="Performed By"
          value={filters.performedBy}
          onChange={(event) => setFilters((prev) => ({ ...prev, performedBy: event.target.value }))}
        >
          <option value="">All performers</option>
          {performers.map((performedBy) => (
            <option key={performedBy} value={performedBy}>
              {performedBy}
            </option>
          ))}
        </MhdFilterSelect>
        <MhdFilterSelect
          label="Linked Entity"
          value={filters.entityType}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              entityType: event.target.value as MhdTaskAuditFilters['entityType'],
            }))
          }
        >
          <option value="ALL">All entities</option>
          {MHD_TASK_AUDIT_ENTITY_TYPES.map((entityType) => (
            <option key={entityType} value={entityType}>
              {entityType}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      <MhdCard className="overflow-hidden p-0">
        {timelineLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading audit timeline...</p>
        ) : timelineError ? (
          <p className="p-4 text-sm text-red-700">
            {(timelineError as Error).message ?? 'Unable to load the audit timeline.'}
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No audit entries match the current filters.</p>
        ) : (
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Performed At</MhdTh>
                <MhdTh>Performed By</MhdTh>
                <MhdTh>Entity</MhdTh>
                <MhdTh>Action</MhdTh>
                <MhdTh>Field</MhdTh>
                <MhdTh>Old Value</MhdTh>
                <MhdTh>New Value</MhdTh>
                <MhdTh>Source Module</MhdTh>
                <MhdTh>IP Address</MhdTh>
                <MhdTh>User Agent</MhdTh>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <MhdTr key={entry.id}>
                  <MhdTd className="whitespace-nowrap">{formatDateTime(entry.performedAt)}</MhdTd>
                  <MhdTd>{entry.performedBy ?? '—'}</MhdTd>
                  <MhdTd>{entry.entityType}</MhdTd>
                  <MhdTd>{entry.actionType}</MhdTd>
                  <MhdTd>{entry.fieldName ?? '—'}</MhdTd>
                  <MhdTd className="max-w-xs truncate" title={entry.oldValue ?? undefined}>
                    {entry.oldValue ?? '—'}
                  </MhdTd>
                  <MhdTd className="max-w-xs truncate" title={entry.newValue ?? undefined}>
                    {entry.newValue ?? '—'}
                  </MhdTd>
                  <MhdTd>{entry.sourceModule ?? '—'}</MhdTd>
                  <MhdTd>{entry.ipAddress ?? '—'}</MhdTd>
                  <MhdTd className="max-w-xs truncate" title={entry.userAgent ?? undefined}>
                    {entry.userAgent ?? '—'}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        )}
      </MhdCard>
    </div>
  );
}
