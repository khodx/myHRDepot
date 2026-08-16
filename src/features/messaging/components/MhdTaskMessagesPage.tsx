import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdEntityMessagingPanel } from '@/components/ui/MhdEntityMessagingPanel';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '@/features/tasks/Service';

export function MhdTaskMessagesPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { profile } = useMhdAuth();

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
        title="Task Messages"
        description="Conversation attached to this task."
      />

      <MhdTaskRecordTabs taskId={taskId} active="messages" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading task...</p>
      ) : error || !task ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(error as Error)?.message ?? 'Task not found'}
        </p>
      ) : (
        <MhdEntityMessagingPanel
          entityType="TASK"
          entityId={task.id}
          companyId={task.companyId}
          currentUserId={profile?.userId ?? null}
          defaultExpanded
        />
      )}
    </div>
  );
}
