import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import { MhdTaskStatusBadge } from './MhdTaskStatusBadge';
import { MhdTaskPriorityBadge } from './MhdTaskPriorityBadge';
import type { MhdSubtask } from '@/features/tasks/Types';

interface MhdSubtaskListProps {
  subtasks: MhdSubtask[];
  onEdit: (subtask: MhdSubtask) => void;
  onDelete: (subtaskId: string) => void;
}

/**
 * Inline edit/delete on each row — subtasks have no detail page of their
 * own, and there is deliberately no child page beyond this list (no
 * subtasks-of-subtasks).
 */
export function MhdSubtaskList({ subtasks, onEdit, onDelete }: MhdSubtaskListProps) {
  if (subtasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No subtasks yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {subtasks.map((subtask) => (
        <li key={subtask.id} className="flex flex-wrap items-center gap-3 p-3">
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
              Due {new Date(subtask.dueDate).toLocaleDateString()}
            </span>
          ) : null}
          <MhdProgressBar
            percent={subtask.overallProgressPercent}
            tone="graduated"
            showLabel
            className="w-32"
          />
          <div className="flex shrink-0 items-center gap-2">
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
