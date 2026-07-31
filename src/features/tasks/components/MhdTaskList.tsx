import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { MhdTaskPriorityBadge } from '@/features/tasks/components/MhdTaskPriorityBadge';
import { MhdTaskStatusBadge } from '@/features/tasks/components/MhdTaskStatusBadge';
import type { MhdTask } from '@/features/tasks/Types';

interface MhdTaskListProps {
  tasks: MhdTask[];
  isLoading: boolean;
  onDelete: (taskId: string) => Promise<void>;
  selectedIds: string[];
  onToggleSelect: (taskId: string) => void;
  onToggleSelectAll: (taskIds: string[]) => void;
}

const PAGE_SIZE = 10;

function initialsFor(names: string[]) {
  const source = names[0] ?? 'Unassigned';
  return (
    source
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'UA'
  );
}

function formatTaskDate(dateValue: string | null, emptyLabel: string) {
  if (!dateValue) return emptyLabel;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString();
}

function formatDueDate(dueDate: string | null) {
  return formatTaskDate(dueDate, 'No due date');
}

const alertBadgeClass = 'inline-flex rounded-full border px-2 py-1 text-xs font-semibold';

export function MhdTaskList({
  tasks,
  isLoading,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: MhdTaskListProps) {
  if (isLoading)
    return <MhdCard className="p-6 text-sm text-muted-foreground">Loading tasks...</MhdCard>;
  if (tasks.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={ListChecks}
          title="No tasks found"
          description="No tasks match the current filters."
        />
      </MhdCard>
    );
  }

  const visibleTasks = tasks.slice(0, PAGE_SIZE);
  const rangeEnd = Math.min(PAGE_SIZE, tasks.length);
  const visibleTaskIds = visibleTasks.map((task) => task.id);
  const selectedIdSet = new Set(selectedIds);
  const allVisibleSelected =
    visibleTaskIds.length > 0 && visibleTaskIds.every((taskId) => selectedIdSet.has(taskId));
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh className="w-10">
              <input
                type="checkbox"
                aria-label="Select all visible tasks"
                className="h-4 w-4 rounded"
                checked={allVisibleSelected}
                onChange={() => onToggleSelectAll(visibleTaskIds)}
              />
            </MhdTh>
            <MhdTh>Task Name</MhdTh>
            <MhdTh>Assigned</MhdTh>
            <MhdTh>Start Date</MhdTh>
            <MhdTh>Assignee</MhdTh>
            <MhdTh>Priority</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Due</MhdTh>
            <MhdTh>Progress</MhdTh>
            <MhdTh>Flags</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {visibleTasks.map((task) => {
            const progress = task.calculatedProgressPercent ?? task.manualProgressPercent;
            const isOverdue = Boolean(
              task.dueDate && !task.completedDate && task.dueDate < todayIso,
            );
            const isUnassigned = task.assignedUserIds.length === 0;
            return (
              <MhdTr key={task.id} to={`/tasks/${task.id}`}>
                <MhdTd className="align-top">
                  <input
                    type="checkbox"
                    aria-label={`Select ${task.title}`}
                    className="h-4 w-4 rounded"
                    checked={selectedIdSet.has(task.id)}
                    onChange={() => onToggleSelect(task.id)}
                  />
                </MhdTd>
                <MhdTd className="align-top">
                  <div className="font-semibold text-foreground">{task.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {task.referenceId} - {task.noteCount} notes - {task.attachmentCount} files
                  </div>
                </MhdTd>
                <MhdTd className="whitespace-nowrap align-top text-sm">
                  {formatTaskDate(task.assignedDate, '')}
                </MhdTd>
                <MhdTd className="whitespace-nowrap align-top text-sm">
                  {formatTaskDate(task.startDate, 'Not started')}
                </MhdTd>
                <MhdTd className="align-top">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-hover">
                      {initialsFor(task.assignedDisplayNames)}
                    </span>
                    <span className="max-w-40 truncate text-sm">
                      {task.assignedDisplayNames.length > 0
                        ? task.assignedDisplayNames.join(', ')
                        : 'Unassigned'}
                    </span>
                  </div>
                </MhdTd>
                <MhdTd className="align-top">
                  <MhdTaskPriorityBadge
                    priorityName={task.priorityName}
                    colorToken={task.priorityColorToken}
                  />
                </MhdTd>
                <MhdTd className="align-top">
                  <MhdTaskStatusBadge
                    statusName={task.statusName}
                    colorToken={task.statusColorToken}
                  />
                </MhdTd>
                <MhdTd className="whitespace-nowrap align-top text-sm">
                  {formatDueDate(task.dueDate)}
                </MhdTd>
                <MhdTd className="align-top">
                  <MhdProgressBar percent={progress} tone="graduated" showLabel />
                </MhdTd>
                <MhdTd className="align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {isOverdue ? (
                      <span className={`${alertBadgeClass} bg-red-100 text-red-700 border-red-200`}>
                        Overdue
                      </span>
                    ) : null}
                    {isUnassigned ? (
                      <span
                        className={`${alertBadgeClass} bg-neutral-100 text-neutral-700 border-neutral-200`}
                      >
                        Unassigned
                      </span>
                    ) : null}
                  </div>
                </MhdTd>
                <MhdTableActions
                  viewTo={`/tasks/${task.id}`}
                  onDelete={() => onDelete(task.id)}
                  deleteConfirmMessage={`Delete task "${task.title}"?`}
                />
              </MhdTr>
            );
          })}
        </tbody>
      </MhdTable>
      <MhdTableFooter summary={`Showing 1 to ${rangeEnd} of ${tasks.length} tasks`}>
        <Button variant="secondary" className="h-7 px-2 text-xs" disabled>
          Previous
        </Button>
        <Button className="h-7 px-2.5 text-xs">
          1
        </Button>
        <Button variant="secondary" className="h-7 px-2 text-xs" disabled={tasks.length <= PAGE_SIZE}>
          Next
        </Button>
      </MhdTableFooter>
    </MhdCard>
  );
}
