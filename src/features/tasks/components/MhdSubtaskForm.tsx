import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml, mhdPlainTextToRichHtml } from '@/components/ui/MhdRichTextUtils';
import type {
  MhdCreateSubtaskInput,
  MhdSubtask,
  MhdTask,
  MhdTaskPriorityOption,
  MhdTaskStatusOption,
  MhdUpdateSubtaskInput,
} from '@/features/tasks/Types';

interface MhdSubtaskFormValues {
  title: string;
  descriptionPlainText: string;
  descriptionRichText: unknown | null;
  statusId: string;
  priorityId: string;
  dueDate: string;
  manualProgressPercent: number;
}

interface MhdSubtaskFormProps {
  /** Read-only parent context, shown at the top per the "no nested subtasks"
   *  convention — this form never offers an "Add Subtask" affordance of its own. */
  parentTask: MhdTask;
  statuses: MhdTaskStatusOption[];
  priorities: MhdTaskPriorityOption[];
  selectedSubtask: MhdSubtask | null;
  isSaving: boolean;
  onCreate: (input: MhdCreateSubtaskInput) => Promise<void>;
  onUpdate: (input: MhdUpdateSubtaskInput) => Promise<void>;
  onCancel: () => void;
}

function emptyValues(statuses: MhdTaskStatusOption[]): MhdSubtaskFormValues {
  return {
    title: '',
    descriptionPlainText: '',
    descriptionRichText: null,
    statusId: statuses[0]?.id ?? '',
    priorityId: '',
    dueDate: '',
    manualProgressPercent: 0,
  };
}

export function MhdSubtaskForm({
  parentTask,
  statuses,
  priorities,
  selectedSubtask,
  isSaving,
  onCreate,
  onUpdate,
  onCancel,
}: MhdSubtaskFormProps) {
  const [values, setValues] = useState<MhdSubtaskFormValues>(() => emptyValues(statuses));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSubtask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected subtask prop
      setValues({
        title: selectedSubtask.title,
        descriptionPlainText: selectedSubtask.descriptionPlainText ?? '',
        descriptionRichText: selectedSubtask.descriptionRichText ?? null,
        statusId: selectedSubtask.statusId,
        priorityId: selectedSubtask.priorityId ?? '',
        dueDate: selectedSubtask.dueDate ?? '',
        manualProgressPercent: selectedSubtask.manualProgressPercent,
      });
    } else {
      setValues(emptyValues(statuses));
    }
  }, [selectedSubtask, statuses]);

  function updateValue<K extends keyof MhdSubtaskFormValues>(
    key: K,
    value: MhdSubtaskFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (values.title.trim().length < 2) {
      setFormError('Subtask title must be at least 2 characters.');
      return;
    }

    try {
      if (selectedSubtask) {
        await onUpdate({ ...values, taskId: parentTask.id, subtaskId: selectedSubtask.id });
      } else {
        await onCreate({ ...values, taskId: parentTask.id });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save subtask.');
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <h2 className="text-[15px] font-semibold text-foreground">
        {selectedSubtask ? 'Edit Subtask' : 'Add Subtask'}
      </h2>

      <div className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <p className="text-xs uppercase tracking-wide">Parent Task</p>
        <p className="mt-0.5 text-foreground">
          {parentTask.referenceId} — {parentTask.title}
        </p>
      </div>

      {formError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground md:col-span-2">
          Title
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.title}
            onChange={(event) => updateValue('title', event.target.value)}
          />
        </label>

        <div className="md:col-span-2">
          <MhdRichTextEditor
            label="Description"
            html={
              values.descriptionRichText
                ? mhdDocumentToRichHtml(values.descriptionRichText, values.descriptionPlainText)
                : mhdPlainTextToRichHtml(values.descriptionPlainText)
            }
            onChange={(_, plainText, document) => {
              updateValue('descriptionPlainText', plainText);
              updateValue('descriptionRichText', document);
            }}
            placeholder="Describe the subtask."
          />
        </div>

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
          Due Date
          <MhdDateField
            className="mt-1 w-full"
            value={values.dueDate}
            onChange={(nextValue) => updateValue('dueDate', nextValue)}
          />
        </label>

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
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : selectedSubtask ? 'Update Subtask' : 'Add Subtask'}
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
