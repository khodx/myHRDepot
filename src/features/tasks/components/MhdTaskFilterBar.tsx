import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
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
}

export function MhdTaskFilterBar({
  companies,
  statuses,
  priorities,
  assignableUsers,
  filters,
  onChange,
}: MhdTaskFilterBarProps) {
  return (
    <MhdFilterBar
      onClear={() =>
        onChange({
          companyId: 'ALL',
          statusId: 'ALL',
          priorityId: 'ALL',
          assignedUserId: 'ALL',
          searchTerm: '',
          dueFrom: '',
          dueTo: '',
        })
      }
    >
      <MhdFilterSelect
        label="Company"
        value={filters.companyId}
        onChange={(event) => onChange({ ...filters, companyId: event.target.value })}
      >
        <option value="ALL">All companies</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.companyName}
          </option>
        ))}
      </MhdFilterSelect>
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
      <MhdFilterSelect label="Department" value="ALL" disabled>
        <option value="ALL">Not assigned</option>
      </MhdFilterSelect>
      <MhdFilterSelect
        label="Assignee"
        value={filters.assignedUserId}
        onChange={(event) => onChange({ ...filters, assignedUserId: event.target.value })}
      >
        <option value="ALL">Anyone</option>
        {assignableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.displayName}
          </option>
        ))}
      </MhdFilterSelect>
      <MhdFilterInput
        type="date"
        label="Due From"
        value={filters.dueFrom}
        onChange={(event) => onChange({ ...filters, dueFrom: event.target.value })}
      />
      <MhdFilterInput
        type="date"
        label="Due To"
        value={filters.dueTo}
        onChange={(event) => onChange({ ...filters, dueTo: event.target.value })}
      />
      <MhdFilterInput
        label="Search"
        value={filters.searchTerm}
        onChange={(event) => onChange({ ...filters, searchTerm: event.target.value })}
        placeholder="Task, company, reference"
      />
    </MhdFilterBar>
  );
}
