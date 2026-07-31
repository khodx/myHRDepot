import { Navigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskNotesPanel } from './MhdTaskNotesPanel';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';

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
        description="Task comments and internal notes in timeline order, with visibility, editing, and deletion handled per note."
      />

      <MhdTaskRecordTabs taskId={taskId} active="notes" />

      <MhdTaskNotesPanel taskId={taskId} />
    </div>
  );
}
