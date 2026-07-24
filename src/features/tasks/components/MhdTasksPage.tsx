import { useMemo, useState } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskFilterBar } from '@/features/tasks/components/MhdTaskFilterBar';
import { MhdTaskForm } from '@/features/tasks/components/MhdTaskForm';
import { MhdTaskList } from '@/features/tasks/components/MhdTaskList';
import { MhdTaskSummaryCards } from '@/features/tasks/components/MhdTaskSummaryCards';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdTasks } from '@/features/tasks/Hook';
import type { MhdTask } from '@/features/tasks/Types';

export function MhdTasksPage() {
  const { profile } = useMhdAuth();
  const [selectedTask, setSelectedTask] = useState<MhdTask | null>(null);
  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  // The companies feature exposes a react-query hook keyed by list filters
  // (not the actor-context state hook this page originally assumed).
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const taskState = useMhdTasks(actorContext);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Task Management"
        description="Create, assign, filter, and track client work."
      />

      {taskState.errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {taskState.errorMessage}
        </div>
      )}

      <MhdTaskSummaryCards summary={taskState.summary} />

      <MhdTaskFilterBar
        companies={companies}
        statuses={taskState.statuses}
        priorities={taskState.priorities}
        assignableUsers={taskState.assignableUsers}
        filters={taskState.filters}
        onChange={taskState.setFilters}
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <MhdTaskForm
          companies={companies}
          statuses={taskState.statuses}
          priorities={taskState.priorities}
          assignableUsers={taskState.assignableUsers}
          selectedTask={selectedTask}
          isSaving={taskState.isSaving}
          onCreate={taskState.createTask}
          onUpdate={taskState.updateTask}
          onCancelEdit={() => setSelectedTask(null)}
        />
        <MhdTaskList
          tasks={taskState.tasks}
          isLoading={taskState.isLoading}
          onEdit={setSelectedTask}
          onDelete={taskState.deleteTask}
        />
      </div>
    </div>
  );
}
