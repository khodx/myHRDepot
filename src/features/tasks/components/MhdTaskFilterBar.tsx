import { MhdDateRangeField } from '@/components/ui/MhdDateRangeField';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import type { MhdCompany } from '@/features/companies/Types';
import type {
  MhdTaskAssignableUser,
  MhdTaskDateFilterField,
  MhdTaskListFilters,
  MhdTaskPriorityOption,
  MhdTaskStatusOption,
} from '@/features/tasks/Types';

// Options for the single cascading date filter — the From/To range and
// presets below apply to whichever of these is selected, so adding another
// filterable date column later is one more entry here, not another pair of
// boxes in the filter bar.
const DATE_FILTER_FIELD_OPTIONS: Array<{ id: MhdTaskDateFilterField; label: string }> = [
  { id: 'due', label: 'Due Date' },
  { id: 'assigned', label: 'Assigned Date' },
  { id: 'start', label: 'Start Date' },
  { id: 'completed', label: 'Completed Date' },
  { id: 'created', label: 'Created Date' },
];

interface MhdTaskFilterBarProps {
  companies: MhdCompany[];
  statuses: MhdTaskStatusOption[];
  priorities: MhdTaskPriorityOption[];
  assignableUsers: MhdTaskAssignableUser[];
  filters: MhdTaskListFilters;
  onChange: (filters: MhdTaskListFilters) => void;
  canEditCompany: boolean;
  currentUserCompanyId: string;
}

export function MhdTaskFilterBar({
  companies,
  statuses,
  priorities,
  assignableUsers,
  filters,
  onChange,
  canEditCompany,
  currentUserCompanyId,
}: MhdTaskFilterBarProps) {
  const companyValue = canEditCompany
    ? filters.companyId
    : currentUserCompanyId || filters.companyId;
  const assigneeOptions = assignableUsers.map((user) => ({
    id: user.id,
    label: user.displayName,
    sublabel: user.email || undefined,
  }));
  const dateFilterFieldLabel =
    DATE_FILTER_FIELD_OPTIONS.find((option) => option.id === filters.dateFilterField)?.label ??
    'Date';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-[30%]">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Company
            </span>
            <MhdSearchableSelect
              options={[
                { id: 'ALL', label: 'All companies' },
                ...companies.map((company) => ({ id: company.id, label: company.companyName })),
              ]}
              value={companyValue}
              disabled={!canEditCompany}
              onChange={(companyId) => onChange({ ...filters, companyId })}
              placeholder="All companies"
              emptyMessage="No companies match your search."
            />
          </label>
        </div>

        <div className="sm:w-[70%]">
          <MhdFilterInput
            label="Search"
            value={filters.searchTerm}
            onChange={(event) => onChange({ ...filters, searchTerm: event.target.value })}
            placeholder="Task, company, reference"
          />
        </div>
      </div>

      <MhdFilterBar
        onClear={() =>
          onChange({
            companyId: canEditCompany ? 'ALL' : currentUserCompanyId,
            statusId: 'ALL',
            priorityId: 'ALL',
            assignedUserIds: [],
            searchTerm: '',
            dateFilterField: 'due',
            dateFrom: '',
            dateTo: '',
          })
        }
      >
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Assignee
          </span>
          <MhdMultiSelectCombobox
            options={assigneeOptions}
            value={filters.assignedUserIds}
            onChange={(next) => onChange({ ...filters, assignedUserIds: next })}
            placeholder="Anyone"
            emptyMessage="No assignable users match your search."
          />
        </label>

        <MhdFilterSelect
          label="Status"
          value={filters.statusId}
          onChange={(event) => onChange({ ...filters, statusId: event.target.value })}
        >
          <option value="ALL">All statuses</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.statusName}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Priority"
          value={filters.priorityId}
          onChange={(event) => onChange({ ...filters, priorityId: event.target.value })}
        >
          <option value="ALL">All priorities</option>
          {priorities.map((priority) => (
            <option key={priority.id} value={priority.id}>
              {priority.priorityName}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Date Field"
          value={filters.dateFilterField}
          onChange={(event) =>
            onChange({
              ...filters,
              dateFilterField: event.target.value as MhdTaskDateFilterField,
            })
          }
        >
          {DATE_FILTER_FIELD_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdDateRangeField
          label={dateFilterFieldLabel}
          className="lg:col-span-2"
          from={filters.dateFrom}
          to={filters.dateTo}
          onChangeFrom={(dateFrom) => onChange({ ...filters, dateFrom })}
          onChangeTo={(dateTo) => onChange({ ...filters, dateTo })}
          onPresetSelect={(dateFrom, dateTo) => onChange({ ...filters, dateFrom, dateTo })}
        />
      </MhdFilterBar>
    </div>
  );
}
