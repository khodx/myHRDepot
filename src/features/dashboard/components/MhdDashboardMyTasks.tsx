import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import type { MhdDashboardMyTask } from '../Types';

interface Props {
  tasks: MhdDashboardMyTask[];
}

export function MhdDashboardMyTasks({ tasks }: Props) {
  const navigate = useNavigate();

  if (tasks.length === 0) {
    return (
      <p className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No tasks assigned to you
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {tasks.map((task) => (
        <button
          key={task.taskId}
          type="button"
          onClick={() => navigate(`/tasks/${task.taskId}`)}
          className="w-full px-0 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {task.referenceId} · {task.companyName}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {/* Status colors are workflow-configured server-side, so this pill
                  keeps its dynamic token rather than the semantic set. */}
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${task.statusColorToken ?? '#64748b'}22`,
                  color: task.statusColorToken ?? '#64748b',
                }}
              >
                {task.statusName}
              </span>
              {task.dueDate && (
                <span
                  className={clsx(
                    'text-xs',
                    task.isOverdue ? 'font-semibold text-red-700' : 'text-muted-foreground',
                  )}
                >
                  {task.isOverdue ? 'Overdue: ' : 'Due: '}
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {task.overallProgressPercent > 0 && (
            <MhdProgressBar percent={task.overallProgressPercent} className="mt-2" />
          )}
        </button>
      ))}
    </div>
  );
}
