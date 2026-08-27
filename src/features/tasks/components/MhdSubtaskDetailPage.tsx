import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdBreadcrumb } from '@/appshell/components/MhdBreadcrumb';
import { Button } from '@/components/ui/Button';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdEntityMessagingPanel } from '@/components/ui/MhdEntityMessagingPanel';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { MhdSystemFieldsCard } from '@/components/ui/MhdSystemFieldsCard';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '../Service';
import { useMhdSubtasks } from '../SubtaskHook';
import { MhdSubtaskForm } from './MhdSubtaskForm';
import { MhdTaskPriorityBadge } from './MhdTaskPriorityBadge';
import { MhdTaskStatusBadge } from './MhdTaskStatusBadge';

export function MhdSubtaskDetailPage() {
  const { taskId, subtaskId } = useParams<{ taskId: string; subtaskId: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
  } = useQuery({
    queryKey: ['mhd-task', taskId],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['mhd-task-status-options'],
    queryFn: () => mhdTaskService.listStatusOptions(),
  });
  const { data: priorities = [] } = useQuery({
    queryKey: ['mhd-task-priority-options'],
    queryFn: () => mhdTaskService.listPriorityOptions(),
  });

  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  const subtaskState = useMhdSubtasks(taskId ?? '', actorContext);
  const subtask = subtaskState.subtasks.find((candidate) => candidate.id === subtaskId) ?? null;

  async function handleDelete() {
    if (!subtask || !taskId) return;
    if (!window.confirm(`Delete subtask "${subtask.title}"? This cannot be undone.`)) return;
    await subtaskState.deleteSubtask(subtask.id);
    navigate(`/tasks/${taskId}`);
  }

  if (!taskId || !subtaskId) return <Navigate to="/tasks" replace />;

  if (taskLoading || subtaskState.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading subtask...</p>
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{(taskError as Error)?.message ?? 'Task not found'}</p>
        <Link to="/tasks" className="text-sm text-blue-600 hover:underline">
          Back to Tasks
        </Link>
      </div>
    );
  }

  if (!subtask) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">Subtask not found</p>
        <Link to={`/tasks/${taskId}`} className="text-sm text-blue-600 hover:underline">
          Back to Task
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[93.6rem] space-y-6 p-6">
      <MhdBreadcrumb
        items={[
          { label: 'Tasks', to: '/tasks' },
          { label: task.referenceId, to: `/tasks/${task.id}` },
          { label: subtask.referenceId },
        ]}
      />

      <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">{subtask.referenceId}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{subtask.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Subtask of{' '}
              <Link to={`/tasks/${task.id}`} className="text-accent-hover hover:underline">
                {task.referenceId} - {task.title}
              </Link>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="warning" onClick={() => setIsEditModalOpen(true)}>
              Edit
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4">
          <dl className="w-full space-y-4">
            <MhdDetailField label="Status" value={<MhdTaskStatusBadge statusName={subtask.statusName} colorToken={subtask.statusColorToken} />} />
            <MhdDetailField label="Priority" value={<MhdTaskPriorityBadge priorityName={subtask.priorityName} colorToken={subtask.priorityColorToken} />} />
            <MhdDetailField label="Due date" value={subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString() : null} />
          </dl>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Progress</p>
          <MhdProgressBar percent={subtask.overallProgressPercent} tone="graduated" showLabel />
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
            <MhdDetailField label="Description" value={<MhdRichTextRenderer
              html={mhdDocumentToRichHtml(
                subtask.descriptionRichText,
                subtask.descriptionPlainText ?? '',
              )}
              className="text-neutral-700"
            />} />
          </div>
      </div>

      <MhdEntityMessagingPanel
        entityType="SUBTASK"
        entityId={subtask.id}
        companyId={task.companyId}
        currentUserId={profile?.userId ?? null}
      />

      <MhdSystemFieldsCard
        id={subtask.id}
        referenceId={subtask.referenceId}
        createdAt={subtask.createdAt}
        createdBy={subtask.createdBy}
        updatedAt={subtask.updatedAt}
        updatedBy={subtask.updatedBy}
      />

      {isEditModalOpen && (
        <MhdModal onClose={() => setIsEditModalOpen(false)} title="Edit Subtask">
          <MhdSubtaskForm
            parentTask={task}
            statuses={statuses}
            priorities={priorities}
            selectedSubtask={subtask}
            isSaving={subtaskState.isSaving}
            onCreate={async () => {
              // Unreachable: MhdSubtaskForm only calls onCreate when selectedSubtask is null,
              // and this page always passes an existing subtask.
            }}
            onUpdate={async (input) => {
              await subtaskState.updateSubtask(input);
              setIsEditModalOpen(false);
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </MhdModal>
      )}
    </div>
  );
}
