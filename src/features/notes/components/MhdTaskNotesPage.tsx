import { Link, Navigate, useParams } from 'react-router-dom';
import { MhdTaskNotesPanel } from './MhdTaskNotesPanel';

/**
 * Route: /tasks/:taskId/notes
 * Full-page notes & comments view for a task, reached from the task list's
 * Comments link (per the 03.5 package spec). Renders inside MhdAppShell, so
 * no page-level chrome beyond the header.
 */
export function MhdTaskNotesPage() {
  const { taskId } = useParams<{ taskId: string }>();

  if (!taskId) return <Navigate to="/tasks" replace />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Notes & Comments</h1>
          <p className="mt-1 text-sm text-slate-600">
            <Link className="text-blue-700 hover:underline" to={`/tasks/${taskId}`}>View task</Link>
          </p>
        </div>
        <Link className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" to="/tasks">
          Back to Tasks
        </Link>
      </div>

      <MhdTaskNotesPanel taskId={taskId} />
    </div>
  );
}
