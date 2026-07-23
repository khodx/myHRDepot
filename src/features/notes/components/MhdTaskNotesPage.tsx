import { Link, Navigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
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
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/tasks"
        backLabel="Tasks"
        title="Task Notes & Comments"
        description={
          <Link className="text-accent hover:text-accent-hover" to={`/tasks/${taskId}`}>
            View task
          </Link>
        }
      />

      <MhdTaskNotesPanel taskId={taskId} />
    </div>
  );
}
