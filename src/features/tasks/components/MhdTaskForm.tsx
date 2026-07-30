import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml, mhdPlainTextToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import { mhdTaskFormSchema, type MhdTaskFormValues } from '@/features/tasks/Schemas';
import { useMhdCompanyHolidays } from '@/features/timeattendance/Hook';
import { addBusinessDays } from '@/utils/mhdBusinessDays';
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
  /** The signed-in user's own company — the default for a new task's Company field. */
  currentUserCompanyId: string;
  /** Only SimplyHR members may change Company; everyone else gets it read-only. */
  canEditCompany: boolean;
  onCreate: (input: MhdCreateTaskInput) => Promise<void>;
  onUpdate: (input: MhdUpdateTaskInput) => Promise<void>;
  onCancelEdit: () => void;
}

const DETAILED_INSTRUCTIONS_SENTINEL = 'No detailed instructions required at this time';
const DUE_DATE_SUGGESTION_BUSINESS_DAYS = 8;

const EMPTY_VALUES: MhdTaskFormValues = {
  companyId: '',
  title: '',
  descriptionPlainText: '',
  descriptionRichText: null,
  detailedInstructionsPlainText: '',
  detailedInstructionsRichText: null,
  statusId: '',
  priorityId: '',
  startDate: '',
  dueDate: '',
  completedDate: '',
  manualProgressPercent: 0,
  assignedUserIds: [],
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MhdTaskForm({
  companies,
  statuses,
  priorities,
  assignableUsers,
  selectedTask,
  isSaving,
  currentUserCompanyId,
  canEditCompany,
  onCreate,
  onUpdate,
  onCancelEdit,
}: MhdTaskFormProps) {
  const [values, setValues] = useState<MhdTaskFormValues>(EMPTY_VALUES);
  const [formError, setFormError] = useState<string | null>(null);
  const dueDateTouchedRef = useRef(false);

  useEffect(() => {
    if (selectedTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected task prop
      setValues({
        companyId: selectedTask.companyId,
        title: selectedTask.title,
        descriptionPlainText: selectedTask.descriptionPlainText ?? '',
        descriptionRichText: selectedTask.descriptionRichText ?? null,
        detailedInstructionsPlainText: selectedTask.detailedInstructionsPlainText ?? '',
        detailedInstructionsRichText: selectedTask.detailedInstructionsRichText ?? null,
        statusId: selectedTask.statusId,
        priorityId: selectedTask.priorityId ?? '',
        startDate: selectedTask.startDate ?? '',
        dueDate: selectedTask.dueDate ?? '',
        completedDate: selectedTask.completedDate ?? '',
        manualProgressPercent: selectedTask.manualProgressPercent,
        assignedUserIds: selectedTask.assignedUserIds,
      });
      dueDateTouchedRef.current = true;
    } else {
      setValues({
        ...EMPTY_VALUES,
        companyId: canEditCompany ? (companies[0]?.id ?? currentUserCompanyId) : currentUserCompanyId,
        statusId: statuses[0]?.id ?? '',
        priorityId: priorities[0]?.id ?? '',
      });
      dueDateTouchedRef.current = false;
    }
  }, [canEditCompany, companies, currentUserCompanyId, priorities, selectedTask, statuses]);

  const filteredAssignableUsers = useMemo(
    () =>
      assignableUsers.filter(
        (user) => values.companyId === '' || user.companyId === values.companyId,
      ),
    [assignableUsers, values.companyId],
  );

  const assignableUserOptions = useMemo(
    () =>
      filteredAssignableUsers.map((user) => ({
        id: user.id,
        label: user.displayName,
        sublabel: user.email || undefined,
      })),
    [filteredAssignableUsers],
  );

  // Due Date auto-suggestion: only for a brand-new task, only until the user
  // has touched Due Date themselves, and based on the Assigned Date (which is
  // always "today" at creation — mhd_create_task sets it server-side).
  const holidaysQuery = useMhdCompanyHolidays(values.companyId || null);
  useEffect(() => {
    if (selectedTask || dueDateTouchedRef.current || values.dueDate !== '') return;
    if (holidaysQuery.isLoading) return;
    const holidayDates = (holidaysQuery.data ?? []).map((holiday) => holiday.holidayDate);
    const suggestion = addBusinessDays(
      todayIsoDate(),
      DUE_DATE_SUGGESTION_BUSINESS_DAYS,
      holidayDates,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auto-fill suggestion, not a sync loop
    setValues((current) => (current.dueDate === '' ? { ...current, dueDate: suggestion } : current));
  }, [holidaysQuery.data, holidaysQuery.isLoading, selectedTask, values.dueDate]);

  function updateValue<K extends keyof MhdTaskFormValues>(key: K, value: MhdTaskFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = mhdTaskFormSchema.safeParse({
      ...values,
      detailedInstructionsPlainText:
        values.detailedInstructionsPlainText.trim() === ''
          ? DETAILED_INSTRUCTIONS_SENTINEL
          : values.detailedInstructionsPlainText,
    });
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
        companyId: canEditCompany ? (companies[0]?.id ?? currentUserCompanyId) : currentUserCompanyId,
        statusId: statuses[0]?.id ?? '',
        priorityId: priorities[0]?.id ?? '',
      });
      dueDateTouchedRef.current = false;
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
        <label className="text-sm font-medium text-foreground md:col-span-2">
          Company
          {canEditCompany ? (
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
          ) : (
            <p className="mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {companies.find((company) => company.id === values.companyId)?.companyName ??
                'Your company'}
            </p>
          )}
        </label>

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
            placeholder="Describe the work, context, links, and acceptance criteria."
          />
        </div>

        <div className="md:col-span-2">
          <MhdRichTextEditor
            label="Detailed Instructions"
            html={
              values.detailedInstructionsRichText
                ? mhdDocumentToRichHtml(
                    values.detailedInstructionsRichText,
                    values.detailedInstructionsPlainText,
                  )
                : mhdPlainTextToRichHtml(values.detailedInstructionsPlainText)
            }
            onChange={(_, plainText, document) => {
              updateValue('detailedInstructionsPlainText', plainText);
              updateValue('detailedInstructionsRichText', document);
            }}
            placeholder={DETAILED_INSTRUCTIONS_SENTINEL}
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
          Assigned Date
          {selectedTask ? (
            <p className="mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {new Date(selectedTask.assignedDate).toLocaleDateString()}
            </p>
          ) : (
            <p className="mt-1 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              Today ({new Date(todayIsoDate()).toLocaleDateString()})
            </p>
          )}
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Set automatically at creation; never changes.
          </span>
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
            onChange={(event) => {
              dueDateTouchedRef.current = true;
              updateValue('dueDate', event.target.value);
            }}
          />
          {!selectedTask && (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Suggested {DUE_DATE_SUGGESTION_BUSINESS_DAYS} business days from today; edit freely.
            </span>
          )}
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
          <MhdMultiSelectCombobox
            className="mt-1"
            options={assignableUserOptions}
            value={values.assignedUserIds}
            onChange={(next) => updateValue('assignedUserIds', next)}
            placeholder="Search assignable users…"
            emptyMessage="No assignable users match your search."
          />
        </label>
      </div>

      <Button type="submit" disabled={isSaving} className="mt-4">
        {isSaving ? 'Saving...' : selectedTask ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
}
