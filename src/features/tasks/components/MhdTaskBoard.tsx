import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MhdTaskPriorityBadge } from '@/features/tasks/components/MhdTaskPriorityBadge';
import type { MhdTask, MhdTaskStatusOption } from '@/features/tasks/Types';

interface MhdTaskBoardProps {
  tasks: MhdTask[];
  statuses: MhdTaskStatusOption[];
  isLoading: boolean;
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return 'No due date';
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString();
}

/**
 * Condensed kanban board for Tasks. Columns are built from the same
 * data-driven `statuses` lookup (`public.statuses`, ordered by
 * `displayOrder`) the list/filter bar already uses — tasks statuses are not a
 * fixed TS enum, so the board groups live status rows the same way
 * `MhdPipelineBoard` groups by the company's stage list. Cards use the
 * priority pill rather than repeating the status (already implied by the
 * column) since priority carries more information density per card.
 */
export function MhdTaskBoard({ tasks, statuses, isLoading }: MhdTaskBoardProps) {
  const navigate = useNavigate();

  const orderedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.displayOrder - b.displayOrder),
    [statuses],
  );

  const byStatus = useMemo(() => {
    const groups = new Map<string, MhdTask[]>();
    const unassigned: MhdTask[] = [];
    for (const task of tasks) {
      if (!task.statusId) {
        unassigned.push(task);
        continue;
      }
      const bucket = groups.get(task.statusId) ?? [];
      bucket.push(task);
      groups.set(task.statusId, bucket);
    }
    return { groups, unassigned };
  }, [tasks]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tasks…</p>;
  }

  function renderCard(task: MhdTask) {
    return (
      <button
        key={task.id}
        type="button"
        onClick={() => navigate(`/tasks/${task.id}`)}
        className="w-full space-y-1.5 rounded-md border border-border bg-card p-2 text-left shadow-sm hover:border-accent"
      >
        <div className="flex items-start justify-between gap-1.5">
          <span className="truncate text-xs font-medium text-foreground">{task.title}</span>
          <MhdTaskPriorityBadge
            priorityName={task.priorityName}
            colorToken={task.priorityColorToken}
          />
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {task.assignedDisplayNames.length > 0
            ? task.assignedDisplayNames.join(', ')
            : 'Unassigned'}
          {' · '}
          {formatDueDate(task.dueDate)}
        </p>
      </button>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {byStatus.unassigned.length > 0 ? (
        <div className="w-64 flex-shrink-0 space-y-2 rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">No Status</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {byStatus.unassigned.length}
            </span>
          </div>
          {byStatus.unassigned.map((task) => renderCard(task))}
        </div>
      ) : null}

      {orderedStatuses.map((status) => {
        const cards = byStatus.groups.get(status.id) ?? [];
        return (
          <div key={status.id} className="w-64 flex-shrink-0 space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{status.statusName}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {cards.length}
              </span>
            </div>
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground">Empty</p>
            ) : (
              cards.map((task) => renderCard(task))
            )}
          </div>
        );
      })}
    </div>
  );
}
