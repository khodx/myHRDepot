import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mhdTaskFormSchema, type MhdTaskFormValues } from '@/features/tasks/Schemas';
import type { MhdCompany } from '@/features/companies/Types';
import type {
  MhdCreateTaskInput,
  MhdTask,
  MhdTaskAssignableUser,
  MhdTaskPriorityOption,
  MhdTaskStatusOption,
  MhdUpdateTaskInput,
} from '@/features/tasks/Types';

interface MhdTaskFormProps {
  companies: MhdCompany[];
  statuses: MhdTaskStatusOption[];
  priorities: MhdTaskPriorityOption[];
  assignableUsers: MhdTaskAssignableUser[];
  selectedTask: MhdTask | null;
  isSaving: boolean;
  onCreate: (input: MhdCreateTaskInput) => Promise<void>;
  onUpdate: (input: MhdUpdateTaskInput) => Promise<void>;
  onCancelEdit: () => void;
}

const EMPTY_VALUES: MhdTaskFormValues = {
  companyId: '',
  title: '',
  descriptionPlainText: '',
  statusId: '',
  priorityId: '',
  startDate: '',
  dueDate: '',
  completedDate: '',
  manualProgressPercent: 0,
  assignedUserIds: [],
};

export function MhdTaskForm({
  companies,
  statuses,
  priorities,
  assignableUsers,
  selectedTask,
  isSaving,
  onCreate,
  onUpdate,
  onCancelEdit,
}: MhdTaskFormProps) {
  const [values, setValues] = useState<MhdTaskFormValues>(EMPTY_VALUES);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected task prop
      setValues({
        companyId: selectedTask.companyId,
        title: selectedTask.title,
        descriptionPlainText: selectedTask.descriptionPlainText ?? '',
        statusId: selectedTask.statusId,
        priorityId: selectedTask.priorityId ?? '',
        startDate: selectedTask.startDate ?? '',
        dueDate: selectedTask.dueDate ?? '',
        completedDate: selectedTask.completedDate ?? '',
        manualProgressPercent: selectedTask.manualProgressPercent,
        assignedUserIds: selectedTask.assignedUserIds,
      });
    } else {
      setValues({
        ...EMPTY_VALUES,
        companyId: companies[0]?.id ?? '',
        statusId: statuses[0]?.id ?? '',
        priorityId: priorities[0]?.id ?? '',
      });
    }
  }, [companies, priorities, selectedTask, statuses]);

  const filteredAssignableUsers = useMemo(
    () =>
      assignableUsers.filter(
        (user) => values.companyId === '' || user.companyId === values.companyId,
      ),
    [assignableUsers, values.companyId],
  );

  function updateValue<K extends keyof MhdTaskFormValues>(key: K, value: MhdTaskFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = mhdTaskFormSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please correct the task form.');
      return;
    }

    try {
      if (selectedTask) {
        await onUpdate({ ...parsed.data, taskId: selectedTask.id });
      } else {
        await onCreate(parsed.data);
      }
      setValues({
        ...EMPTY_VALUES,
        companyId: companies[0]?.id ?? '',
        statusId: statuses[0]?.id ?? '',
        priorityId: priorities[0]?.id ?? '',
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save task.');
    }
  }

  return (
    <form
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-semibold text-foreground">
          {selectedTask ? 'Edit Task' : 'Create Task'}
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onCancelEdit}
        >
          Cancel
        </button>
      </div>

      {formError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Company
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.companyId}
            onChange={(event) => updateValue('companyId', event.target.value)}
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Title
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.title}
            onChange={(event) => updateValue('title', event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-foreground md:col-span-2">
          Description
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.descriptionPlainText}
            onChange={(event) => updateValue('descriptionPlainText', event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Status
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.statusId}
            onChange={(event) => updateValue('statusId', event.target.value)}
          >
            <option value="">Select status</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.statusName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Priority
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.priorityId}
            onChange={(event) => updateValue('priorityId', event.target.value)}
          >
            <option value="">No priority</option>
            {priorities.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.priorityName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Start Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.startDate}
            onChange={(event) => updateValue('startDate', event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Due Date
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.dueDate}
            onChange={(event) => updateValue('dueDate', event.target.value)}
          />
        </label>

        {selectedTask && (
          <label className="text-sm font-medium text-foreground">
            Completed Date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={values.completedDate}
              onChange={(event) => updateValue('completedDate', event.target.value)}
            />
          </label>
        )}

        <label className="text-sm font-medium text-foreground">
          Progress %
          <input
            type="number"
            min="0"
            max="100"
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.manualProgressPercent}
            onChange={(event) => updateValue('manualProgressPercent', Number(event.target.value))}
          />
          {selectedTask && (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {selectedTask.calculatedProgressPercent !== null
                ? `Auto-calculated from subtasks: ${selectedTask.calculatedProgressPercent}% (this manual value is stored separately and shown on the board when there are no subtasks).`
                : 'No subtasks yet — progress shown on the board falls back to this manual value.'}
            </span>
          )}
        </label>

        <label className="text-sm font-medium text-foreground md:col-span-2">
          Assigned Users
          <select
            multiple
            className="mt-1 min-h-28 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.assignedUserIds}
            onChange={(event) =>
              updateValue(
                'assignedUserIds',
                Array.from(event.target.selectedOptions).map((option) => option.value),
              )
            }
          >
            {filteredAssignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
                {user.email ? ` (${user.email})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button type="submit" disabled={isSaving} className="mt-4">
        {isSaving ? 'Saving...' : selectedTask ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
}
