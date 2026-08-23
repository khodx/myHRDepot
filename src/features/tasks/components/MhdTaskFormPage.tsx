import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskForm } from '@/features/tasks/components/MhdTaskForm';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdTasks } from '@/features/tasks/Hook';
import { mhdSubtaskService } from '@/features/tasks/SubtaskService';

export function MhdTaskFormPage() {
  const { taskId } = useParams<{ taskId?: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const isEdit = Boolean(taskId);
  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const taskState = useMhdTasks(actorContext);
  const selectedTask = useMemo(
    () => taskState.tasks.find((task) => task.id === taskId) ?? null,
    [taskId, taskState.tasks],
  );

  if (isEdit && taskState.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading task...</p>;
  }

  if (isEdit && !selectedTask) {
    return (
      <div className="space-y-4">
        <MhdPageHeader title="Task not found" backTo="/tasks" backLabel="Tasks" />
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          The requested task could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[83.2rem] space-y-6">
      <MhdPageHeader
        title={isEdit ? 'Edit Task' : 'New Task'}
        description={
          isEdit
            ? 'Update task assignment, dates, status, priority, and progress.'
            : 'Create a task record on its own page.'
        }
        backTo="/tasks"
        backLabel="Tasks"
      />

      {taskState.errorMessage || companiesQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {taskState.errorMessage ??
            (companiesQuery.error instanceof Error
              ? companiesQuery.error.message
              : 'Unable to load task form references.')}
        </p>
      ) : null}

      <MhdTaskForm
        companies={companies}
        statuses={taskState.statuses}
        priorities={taskState.priorities}
        assignableUsers={taskState.assignableUsers}
        selectedTask={selectedTask}
        isSaving={taskState.isSaving}
        currentUserCompanyId={profile?.companyId ?? ''}
        canEditCompany={profile?.companyIsPlatformOrg ?? false}
        onCreate={async (input, subtaskTitles) => {
          const created = await taskState.createTask(input);
          if (subtaskTitles.length > 0 && actorContext) {
            try {
              for (const [index, title] of subtaskTitles.entries()) {
                await mhdSubtaskService.createSubtask(
                  {
                    taskId: created.id,
                    title,
                    statusId: taskState.statuses[0]?.id ?? '',
                    manualProgressPercent: 0,
                    sortOrder: index,
                  },
                  actorContext,
                );
              }
            } catch (error) {
              window.alert(
                `Task ${created.reference_id} was created, but adding subtasks failed: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }. Add the remaining subtasks from the task's detail page.`,
              );
            }
          }
          navigate(`/tasks/${created.id}`);
        }}
        onUpdate={async (input) => {
          await taskState.updateTask(input);
          navigate(`/tasks/${input.taskId}`);
        }}
        onCancelEdit={() => navigate(isEdit && taskId ? `/tasks/${taskId}` : '/tasks')}
      />
    </div>
  );
}
