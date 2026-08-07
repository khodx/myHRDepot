import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '@/features/tasks/Service';
import {
  TASK_AUDIT_FIELD_CHANGE_REPORT_TEMPLATE_KEY,
  TASK_AUDIT_SECURITY_REPORT_TEMPLATE_KEY,
  TASK_AUDIT_STATUS_HISTORY_REPORT_TEMPLATE_KEY,
} from '../Service';
import { useMhdRequestTaskAuditReport, useMhdTaskAuditTimeline } from '../Hook';
import type { MhdTaskAuditEntityType, MhdTaskAuditFilters } from '../Types';
import { MHD_TASK_AUDIT_DEFAULT_FILTERS } from '../Types';
import { MhdAuditReportPanel } from './MhdAuditReportPanel';
import { MhdAuditTimelineTable } from './MhdAuditTimelineTable';

const MHD_TASK_AUDIT_SYSTEM_REPORT_KEYS = [
  TASK_AUDIT_STATUS_HISTORY_REPORT_TEMPLATE_KEY,
  TASK_AUDIT_FIELD_CHANGE_REPORT_TEMPLATE_KEY,
  TASK_AUDIT_SECURITY_REPORT_TEMPLATE_KEY,
];

const MHD_TASK_AUDIT_ENTITY_TYPES: MhdTaskAuditEntityType[] = [
  'TASK',
  'NOTE',
  'ATTACHMENT',
  'ACTIVITY',
  'SUBTASK',
  'DOCUMENT_GENERATION',
];

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

  async function handleGenerateTemplate(templateKey: string) {
    if (!task) return;
    const generatedByDisplayName = profile?.displayName ?? profile?.email ?? '';
    return requestReport.mutateAsync({ task, generatedByDisplayName, templateKey });
  }

  if (!taskId) return <Navigate to="/tasks" replace />;

  // Belt-and-suspenders: the route guard (mhdRouteAccess.ts) already keeps a
  // non-Platform-Admin/HR-Partner caller from reaching this route, and the
  // tab itself is hidden for them in MhdTaskRecordTabs. This redirect covers
  // a stale bookmark or a role change mid-session.
  const canViewAudit = mhdIsPlatformAdminOrHrPartner(roles);
  if (!canViewAudit) return <Navigate to="/404" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/tasks/${taskId}`}
        backLabel="Task"
        title="Task Audit"
        description="Timeline of changes tied to this task, including task, note, attachment, subtask, and activity events. Filter by date, action, performer, or linked entity before generating a report."
      />

      <MhdTaskRecordTabs taskId={taskId} active="audit" />

      {taskLoading ? (
        <p className="text-sm text-muted-foreground">Loading task...</p>
      ) : taskError || !task ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(taskError as Error)?.message ?? 'Task not found'}
        </p>
      ) : (
        <MhdCard>
          <h2 className="text-sm font-semibold text-foreground">Reports</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Download a template to customize offline, generate directly from this task's current
            audit data, or upload a finished document back.
          </p>
          <div className="mt-4">
            <MhdAuditReportPanel
              masterTemplateKey="TASK_AUDIT_REPORT"
              systemReportTemplateKeys={MHD_TASK_AUDIT_SYSTEM_REPORT_KEYS}
              entityType="TASK"
              entityId={task.id}
              companyId={task.companyId}
              onGenerateTemplate={handleGenerateTemplate}
            />
          </div>
        </MhdCard>
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
        ) : (
          // taskId is already known from the route param, so NOTE/ATTACHMENT
          // rows always resolve here (unlike the company-wide Audit Reports
          // page, which has no parent-task lookup available).
          <MhdAuditTimelineTable
            entries={filteredEntries}
            emptyMessage="No audit entries match the current filters."
            linkContext={{ taskId }}
          />
        )}
      </MhdCard>
    </div>
  );
}
