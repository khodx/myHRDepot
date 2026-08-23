import { ArrowDown, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import { MhdTaskStatusBadge } from './MhdTaskStatusBadge';
import { MhdTaskPriorityBadge } from './MhdTaskPriorityBadge';
import type { MhdSubtask } from '@/features/tasks/Types';
import { mhdFormatDate } from '@/utils/mhdDateFormat';

interface MhdSubtaskListProps {
  subtasks: MhdSubtask[];
  taskId: string;
  onEdit: (subtask: MhdSubtask) => void;
  onDelete: (subtaskId: string) => void;
  onReorder: (subtask: MhdSubtask, direction: 'up' | 'down') => void;
  isReordering: boolean;
}

/**
 * Inline edit/delete on each row, plus a link to the subtask's own detail page
 * (added for messaging support) - there is still no subtasks-of-subtasks nesting.
 */
export function MhdSubtaskList({
  subtasks,
  taskId,
  onEdit,
  onDelete,
  onReorder,
  isReordering,
}: MhdSubtaskListProps) {
  if (subtasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No subtasks yet.</p>;
  }

  const ordered = [...subtasks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {ordered.map((subtask, index) => (
        <li key={subtask.id} className="flex flex-wrap items-center gap-3 p-3">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onReorder(subtask, 'up')}
              disabled={isReordering || index === 0}
              aria-label={`Move ${subtask.title} up`}
              className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onReorder(subtask, 'down')}
              disabled={isReordering || index === ordered.length - 1}
              aria-label={`Move ${subtask.title} down`}
              className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{subtask.title}</p>
            <p className="text-xs text-muted-foreground">{subtask.referenceId}</p>
          </div>
          <MhdTaskStatusBadge statusName={subtask.statusName} colorToken={subtask.statusColorToken} />
          <MhdTaskPriorityBadge
            priorityName={subtask.priorityName}
            colorToken={subtask.priorityColorToken}
          />
          {subtask.dueDate ? (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              Due {mhdFormatDate(subtask.dueDate)}
            </span>
          ) : null}
          <MhdProgressBar
            percent={subtask.overallProgressPercent}
            tone="graduated"
            showLabel
            className="w-32"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/tasks/${taskId}/subtasks/${subtask.id}`}
              className="text-xs font-medium text-accent-hover hover:underline"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => onEdit(subtask)}
              className="text-xs font-medium text-accent-hover hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete subtask "${subtask.title}"? This cannot be undone.`)) {
                  onDelete(subtask.id);
                }
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
