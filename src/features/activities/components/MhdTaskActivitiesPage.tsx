import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateActivities } from '@/appshell/mhdRouteAccess';
import { mhdTaskService } from '@/features/tasks/Service';
import { MhdTaskActivitiesSection } from './MhdTaskActivitiesSection';

/**
 * Route: /tasks/:taskId/activities
 * Full-page Activities view for a task, next to Notes/Attachments/Reports.
 */
export function MhdTaskActivitiesPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateActivities(roles);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['mhd-task', taskId],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  if (!taskId) return <Navigate to="/tasks" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/tasks/${taskId}`}
        backLabel="Task"
        title="Task Activities"
        description="Activities linked to this task, including sessions, calls, visits, participants, notes, and outcomes."
      />

      <MhdTaskRecordTabs taskId={taskId} active="activities" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading task...</p>
      ) : error || !task ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error)?.message ?? 'Task not found'}
        </p>
      ) : (
        <MhdTaskActivitiesSection taskId={task.id} companyId={task.companyId} canMutate={canMutate} />
      )}
    </div>
  );
}
