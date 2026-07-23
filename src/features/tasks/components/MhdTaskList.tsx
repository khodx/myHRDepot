import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
  if (isLoading) return <MhdCard className="p-6 text-sm text-muted-foreground">Loading tasks...</MhdCard>;
  if (tasks.length === 0) {
    return (
      <MhdCard className="border-dashed">
        <MhdEmptyState icon={ListChecks} title="No tasks found" description="No tasks match the current filters." />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Task</MhdTh>
            <MhdTh>Company</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Priority</MhdTh>
            <MhdTh>Assigned</MhdTh>
            <MhdTh>Due</MhdTh>
            <MhdTh className="text-right">Actions</MhdTh>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <MhdTr key={task.id}>
              <MhdTd className="align-top">
                <div className="font-semibold text-foreground">{task.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{task.referenceId} · {task.calculatedProgressPercent ?? task.manualProgressPercent}% complete · {task.noteCount} notes · {task.attachmentCount} files</div>
                {task.descriptionPlainText && <div className="mt-1 max-w-xl truncate text-sm text-muted-foreground">{task.descriptionPlainText}</div>}
              </MhdTd>
              <MhdTd className="align-top text-sm">{task.companyName}</MhdTd>
              <MhdTd className="align-top"><MhdTaskStatusBadge statusName={task.statusName} colorToken={task.statusColorToken} /></MhdTd>
              <MhdTd className="align-top"><MhdTaskPriorityBadge priorityName={task.priorityName} colorToken={task.priorityColorToken} /></MhdTd>
              <MhdTd className="align-top text-sm">{task.assignedDisplayNames.length > 0 ? task.assignedDisplayNames.join(', ') : 'Unassigned'}</MhdTd>
              <MhdTd className="align-top text-sm">{task.dueDate ?? 'No due date'}</MhdTd>
              <MhdTd className="align-top text-right">
                {/* Task list navigation to the task notes page (03.5 package spec). */}
                <Link className="mr-3 text-sm font-semibold text-accent hover:text-accent-hover" to={`/tasks/${task.id}/notes`}>Comments</Link>
                <button className="mr-3 text-sm font-semibold text-accent hover:text-accent-hover" onClick={() => onEdit(task)}>Edit</button>
                <button className="text-sm font-semibold text-red-700 hover:text-red-800" onClick={() => void onDelete(task.id)}>Delete</button>
              </MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
