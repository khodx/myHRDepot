import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import type { MhdDashboardMyTask } from '../Types'

interface Props {
  tasks: MhdDashboardMyTask[]
}

export function MhdDashboardMyTasks({ tasks }: Props) {
  const navigate = useNavigate()

  if (tasks.length === 0) {
    return (
      <p className="flex items-center justify-center py-8 text-sm text-neutral-400">
        No tasks assigned to you
      </p>
    )
  }

  return (
    <div className="divide-y divide-neutral-100">
      {tasks.map((task) => (
        <button
          key={task.taskId}
          type="button"
          onClick={() => navigate(`/tasks/${task.taskId}`)}
          className="w-full px-0 py-3 text-left hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{task.title}</p>
              <p className="text-xs text-neutral-500">
                {task.referenceId} · {task.companyName}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
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
                    task.isOverdue ? 'font-semibold text-red-600' : 'text-neutral-400'
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
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-1 rounded-full bg-blue-500"
                style={{ width: `${task.overallProgressPercent}%` }}
              />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
