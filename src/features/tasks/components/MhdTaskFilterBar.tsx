import { MhdDateRangeField } from '@/components/ui/MhdDateRangeField';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import type { MhdCompany } from '@/features/companies/Types';
import type {
  MhdTaskAssignableUser,
  MhdTaskListFilters,
  MhdTaskPriorityOption,
  MhdTaskStatusOption,
} from '@/features/tasks/Types';

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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-[30%]">
          <MhdFilterSelect
            label="Company"
            value={companyValue}
            disabled={!canEditCompany}
            onChange={(event) => onChange({ ...filters, companyId: event.target.value })}
          >
            <option value="ALL">All companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </MhdFilterSelect>
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
            dueFrom: '',
            dueTo: '',
            assignedFrom: '',
            assignedTo: '',
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

        <MhdDateRangeField
          label="Due Date"
          className="lg:col-span-2"
          from={filters.dueFrom}
          to={filters.dueTo}
          onChangeFrom={(dueFrom) => onChange({ ...filters, dueFrom })}
          onChangeTo={(dueTo) => onChange({ ...filters, dueTo })}
          onPresetSelect={(dueFrom, dueTo) => onChange({ ...filters, dueFrom, dueTo })}
        />

        <MhdDateRangeField
          label="Assigned Date"
          className="lg:col-span-2"
          from={filters.assignedFrom}
          to={filters.assignedTo}
          onChangeFrom={(assignedFrom) => onChange({ ...filters, assignedFrom })}
          onChangeTo={(assignedTo) => onChange({ ...filters, assignedTo })}
          onPresetSelect={(assignedFrom, assignedTo) =>
            onChange({ ...filters, assignedFrom, assignedTo })
          }
        />
      </MhdFilterBar>
    </div>
  );
}
