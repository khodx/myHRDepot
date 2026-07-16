import { Link } from 'react-router-dom';
import { MhdTaskPriorityBadge } from '@/features/tasks/components/MhdTaskPriorityBadge';
import { MhdTaskStatusBadge } from '@/features/tasks/components/MhdTaskStatusBadge';
import type { MhdTask } from '@/features/tasks/Types';

interface MhdTaskListProps {
  tasks: MhdTask[];
  isLoading: boolean;
  onEdit: (task: MhdTask) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export function MhdTaskList({ tasks, isLoading, onEdit, onDelete }: MhdTaskListProps) {
  if (isLoading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading tasks...</div>;
  if (tasks.length === 0) return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No tasks match the current filters.</div>;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Task</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Company</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Assigned</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Due</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-4 py-4 align-top">
                <div className="font-semibold text-slate-900">{task.title}</div>
                <div className="mt-1 text-xs text-slate-500">{task.referenceId} · {task.calculatedProgressPercent ?? task.manualProgressPercent}% complete · {task.noteCount} notes · {task.attachmentCount} files</div>
                {task.descriptionPlainText && <div className="mt-1 max-w-xl truncate text-sm text-slate-600">{task.descriptionPlainText}</div>}
              </td>
              <td className="px-4 py-4 align-top text-sm text-slate-700">{task.companyName}</td>
              <td className="px-4 py-4 align-top"><MhdTaskStatusBadge statusName={task.statusName} colorToken={task.statusColorToken} /></td>
              <td className="px-4 py-4 align-top"><MhdTaskPriorityBadge priorityName={task.priorityName} colorToken={task.priorityColorToken} /></td>
              <td className="px-4 py-4 align-top text-sm text-slate-700">{task.assignedDisplayNames.length > 0 ? task.assignedDisplayNames.join(', ') : 'Unassigned'}</td>
              <td className="px-4 py-4 align-top text-sm text-slate-700">{task.dueDate ?? 'No due date'}</td>
              <td className="px-4 py-4 align-top text-right">
                {/* Task list navigation to the task notes page (03.5 package spec). */}
                <Link className="mr-3 text-sm font-semibold text-blue-700 hover:text-blue-900" to={`/tasks/${task.id}/notes`}>Comments</Link>
                <button className="mr-3 text-sm font-semibold text-blue-700 hover:text-blue-900" onClick={() => onEdit(task)}>Edit</button>
                <button className="text-sm font-semibold text-red-700 hover:text-red-900" onClick={() => void onDelete(task.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
