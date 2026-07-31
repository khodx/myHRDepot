import { Navigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskRecordTabs } from '@/appshell/components/MhdTaskRecordTabs';
import { MhdTaskAttachmentsPanel } from './MhdTaskAttachmentsPanel';

/**
 * Route: /tasks/:taskId/attachments
 * Full-page Attachments view for a task, next to Notes/Activities/Reports.
 * The uploader is a direct upload control, not a "new record" form, so it
 * has no modal of its own — it renders inline like the panel always has.
 */
export function MhdTaskAttachmentsPage() {
  const { taskId } = useParams<{ taskId: string }>();

  if (!taskId) return <Navigate to="/tasks" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/tasks/${taskId}`}
        backLabel="Task"
        title="Task Attachments"
        description="Files uploaded for this task, with descriptions, download links, and row-level delete permissions."
      />

      <MhdTaskRecordTabs taskId={taskId} active="attachments" />

      <MhdTaskAttachmentsPanel taskId={taskId} />
    </div>
  );
}
