import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
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
  const actorContext = useMemo(() => (profile?.userId ? { actorUserId: profile.userId } : null), [profile]);
  // The companies feature exposes a react-query hook keyed by list filters
  // (not the actor-context state hook this page originally assumed).
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const taskState = useMhdTasks(actorContext);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">My HR Depot</p>
            <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
            <p className="mt-1 text-sm text-slate-600">Create, assign, filter, and track client work.</p>
          </div>
          <Link className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" to="/dashboard">Back to Dashboard</Link>
        </div>

        {taskState.errorMessage && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{taskState.errorMessage}</div>}

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
    </main>
  );
}
