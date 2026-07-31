import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MhdBreadcrumb } from './MhdBreadcrumb';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdTaskService } from '@/features/tasks/Service';
import { useMhdSubtasks } from '@/features/tasks/SubtaskHook';
import { MhdSubtaskForm } from '@/features/tasks/components/MhdSubtaskForm';
import { MhdSubtaskList } from '@/features/tasks/components/MhdSubtaskList';
import type { MhdSubtask } from '@/features/tasks/Types';
import { mhdWorkflowService } from '@/features/workflow/Service';
import { MhdStatusTransitionButton } from '@/features/workflow/components/MhdStatusTransitionButton';
import { MhdSLAStatus } from '@/features/workflow/components/MhdSLAStatus';
import { MhdWorkflowStateVisualization } from '@/features/workflow/components/MhdWorkflowStateVisualization';
import { MhdWorkflowTransitionHistory } from '@/features/workflow/components/MhdWorkflowTransitionHistory';
import { mhdCanMutateWorkflowApprovals } from '@/appshell/mhdRouteAccess';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdSystemFieldsCard } from '@/components/ui/MhdSystemFieldsCard';
import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { Button } from '@/components/ui/Button';
import { MhdTaskRecordTabs } from './MhdTaskRecordTabs';

export function MhdTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const [workflowRefreshKey, setWorkflowRefreshKey] = useState(0);
  const canMutateWorkflowApprovals = mhdCanMutateWorkflowApprovals(roles);

  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<MhdSubtask | null>(null);

  const {
    data: task,
    isLoading,
    error,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ['mhd-task', taskId, workflowRefreshKey],
    queryFn: () => mhdTaskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  const { data: availableTransitions = [] } = useQuery({
    queryKey: ['mhd-workflow-available-transitions', taskId, workflowRefreshKey],
    queryFn: () => mhdWorkflowService.getAvailableTransitions(taskId!),
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

  async function refreshWorkflow() {
    await refetchTask();
    setWorkflowRefreshKey((current) => current + 1);
  }

  async function handleDeleteTask() {
    if (!task || !profile?.userId) return;
    await mhdTaskService.deleteTask(task.id, { actorUserId: profile.userId });
    navigate('/tasks');
  }

  function openSubtaskModal(subtask: MhdSubtask | null) {
    setEditingSubtask(subtask);
    setIsSubtaskModalOpen(true);
  }

  async function handleSubtaskSaved() {
    setIsSubtaskModalOpen(false);
    setEditingSubtask(null);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{(error as Error)?.message ?? 'Task not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const progressPercent = task.calculatedProgressPercent ?? task.manualProgressPercent;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <MhdBreadcrumb items={[{ label: 'Tasks', to: '/tasks' }, { label: task.referenceId }]} />

      <MhdTaskRecordTabs
        taskId={task.id}
        active="detail"
        editTo={`/tasks/${task.id}/edit`}
        onDelete={profile?.userId ? handleDeleteTask : undefined}
        deleteConfirmMessage={`Delete task "${task.title}"? This cannot be undone.`}
      />

      <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">{task.referenceId}</p>
            <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{task.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{task.companyName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <MhdStatusTransitionButton
              taskId={task.id}
              currentStatusId={task.statusId}
              currentStatusName={task.statusName}
              onTransitionSuccess={refreshWorkflow}
              disabled={!canMutateWorkflowApprovals || !profile?.userId}
            />
            <div className="flex flex-col items-end gap-1 text-sm text-neutral-600">
              <span>{task.priorityName ?? 'No priority'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
          <span>Assigned: {new Date(task.assignedDate).toLocaleDateString()}</span>
          {task.dueDate ? <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span> : null}
          {task.assignedDisplayNames.length > 0 ? (
            <span>Assignees: {task.assignedDisplayNames.join(', ')}</span>
          ) : null}
          <span>Notes: {task.noteCount}</span>
          <span>Attachments: {task.attachmentCount}</span>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Progress</p>
          <MhdProgressBar percent={progressPercent} tone="graduated" showLabel />
        </div>

        {task.descriptionRichText || task.descriptionPlainText ? (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Description</p>
            <MhdRichTextRenderer
              html={mhdDocumentToRichHtml(
                task.descriptionRichText,
                task.descriptionPlainText ?? '',
              )}
              className="text-neutral-700"
            />
          </div>
        ) : null}

        {task.detailedInstructionsRichText || task.detailedInstructionsPlainText ? (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
              Detailed Instructions
            </p>
            <MhdRichTextRenderer
              html={mhdDocumentToRichHtml(
                task.detailedInstructionsRichText,
                task.detailedInstructionsPlainText ?? '',
              )}
              className="text-neutral-700"
            />
          </div>
        ) : null}

        <div className="mt-4 border-t border-neutral-100 pt-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Workflow
              </h2>
            </div>
            <MhdSLAStatus key={`sla-${task.id}-${workflowRefreshKey}`} taskId={task.id} />
          </div>
          <div className="mt-4 space-y-4">
            <MhdWorkflowStateVisualization
              currentStatusName={task.statusName}
              availableTransitions={availableTransitions}
            />
            <MhdWorkflowTransitionHistory
              key={`history-${task.id}-${workflowRefreshKey}`}
              taskId={task.id}
            />
          </div>
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => openSubtaskModal(null)}>
            Add Subtask
          </Button>
          <h2 className="text-lg font-semibold text-neutral-900">Subtasks</h2>
        </div>
        {subtaskState.errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {subtaskState.errorMessage}
          </div>
        )}
        <MhdSubtaskList
          subtasks={subtaskState.subtasks}
          onEdit={(subtask) => openSubtaskModal(subtask)}
          onDelete={(subtaskId) => void subtaskState.deleteSubtask(subtaskId)}
        />
      </section>

      {isSubtaskModalOpen && (
        <MhdModal
          onClose={() => {
            setIsSubtaskModalOpen(false);
            setEditingSubtask(null);
          }}
          title={editingSubtask ? 'Edit Subtask' : 'Add Subtask'}
        >
          <MhdSubtaskForm
            parentTask={task}
            statuses={statuses}
            priorities={priorities}
            selectedSubtask={editingSubtask}
            isSaving={subtaskState.isSaving}
            onCreate={async (input) => {
              await subtaskState.createSubtask(input);
              await handleSubtaskSaved();
            }}
            onUpdate={async (input) => {
              await subtaskState.updateSubtask(input);
              await handleSubtaskSaved();
            }}
            onCancel={() => {
              setIsSubtaskModalOpen(false);
              setEditingSubtask(null);
            }}
          />
        </MhdModal>
      )}

      <div className="rounded-lg border border-neutral-200 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Access Context</h2>
        <div className="mt-4 space-y-2 text-sm text-neutral-600">
          <p>Signed in as: {profile?.displayName || profile?.email || 'Unknown user'}</p>
          <p>Task company: {task.companyName}</p>
          <p>Workflow actions: {canMutateWorkflowApprovals ? 'Enabled' : 'Read-only'}</p>
        </div>
      </div>

      <MhdSystemFieldsCard
        id={task.id}
        referenceId={task.referenceId}
        createdAt={task.createdAt}
        createdBy={task.createdBy}
        updatedAt={task.updatedAt}
        updatedBy={task.updatedBy}
      />

      <div className="flex justify-end border-t border-neutral-200 pt-4">
        <MhdDetailActions
          editTo={`/tasks/${task.id}/edit`}
          onDelete={profile?.userId ? handleDeleteTask : undefined}
          deleteConfirmMessage={`Delete task "${task.title}"? This cannot be undone.`}
        />
      </div>
    </div>
  );
}
