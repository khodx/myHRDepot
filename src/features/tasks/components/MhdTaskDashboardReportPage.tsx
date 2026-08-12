import { useMemo } from 'react';
import { MhdTaskWorkspaceNav } from '@/appshell/components/MhdTaskWorkspaceNav';
import { MhdAuditReportPanel } from '@/components/ui/MhdAuditReportPanel';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdRequestTaskDashboardReport, useMhdTasks } from '@/features/tasks/Hook';

const MHD_TASK_DASHBOARD_SYSTEM_REPORT_KEYS: string[] = [];

export function MhdTaskDashboardReportPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;

  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  const taskState = useMhdTasks(actorContext, companyId ?? '');
  const requestReport = useMhdRequestTaskDashboardReport(actorContext);

  async function handleGenerateTemplate() {
    if (!companyId) return;
    const generatedByDisplayName = profile?.displayName ?? profile?.email ?? '';
    return requestReport.mutateAsync({
      companyId,
      companyName: profile?.companyName ?? '',
      tasks: taskState.tasks,
      generatedByDisplayName,
    });
  }

  return (
    <div className="space-y-6">
      <MhdTaskWorkspaceNav />
      <MhdPageHeader
        title="Task Dashboard Report"
        description="A printable summary of the current company task list. Generate directly, download the template to customize offline, or upload a finished document back."
      />
      {companyId && (
        <MhdCard>
          <h2 className="text-sm font-semibold text-foreground">Reports</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Download the default template to customize offline, generate directly from the
            current task data, or upload a finished document back.
          </p>
          <div className="mt-4">
            <MhdAuditReportPanel
              masterTemplateKey="TASK_DASHBOARD_REPORT"
              systemReportTemplateKeys={MHD_TASK_DASHBOARD_SYSTEM_REPORT_KEYS}
              entityType="TASK_DASHBOARD_REPORT"
              entityId={companyId}
              companyId={companyId}
              onGenerateTemplate={handleGenerateTemplate}
            />
          </div>
        </MhdCard>
      )}
    </div>
  );
}
