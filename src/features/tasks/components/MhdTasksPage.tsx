import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Layers, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskFilterBar } from '@/features/tasks/components/MhdTaskFilterBar';
import { MhdTaskList } from '@/features/tasks/components/MhdTaskList';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdTasks } from '@/features/tasks/Hook';

export function MhdTasksPage() {
  const { profile } = useMhdAuth();
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
        title="Tasks"
        description="Create, assign, filter, and track client work."
        actions={
          <>
            <Link
              to="/tasks/new"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden />
              New Task
            </Link>
            <Button variant="secondary" className="gap-1.5">
              <Layers className="h-4 w-4" aria-hidden />
              Bulk Actions
            </Button>
            <Button variant="secondary" className="gap-1.5">
              <Save className="h-4 w-4" aria-hidden />
              Save View
            </Button>
            <Button variant="secondary" className="gap-1.5">
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
          </>
        }
      />

      {taskState.errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {taskState.errorMessage}
        </div>
      )}

      <MhdTaskFilterBar
        companies={companies}
        statuses={taskState.statuses}
        priorities={taskState.priorities}
        assignableUsers={taskState.assignableUsers}
        filters={taskState.filters}
        onChange={taskState.setFilters}
      />

      <MhdTaskList
        tasks={taskState.tasks}
        isLoading={taskState.isLoading}
        onDelete={taskState.deleteTask}
      />
    </div>
  );
}
