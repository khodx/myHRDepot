import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import type { MhdCompany } from '@/features/companies/Types';
import type { MhdTaskAssignableUser, MhdTaskListFilters, MhdTaskPriorityOption, MhdTaskStatusOption } from '@/features/tasks/Types';

interface MhdTaskFilterBarProps {
  companies: MhdCompany[];
  statuses: MhdTaskStatusOption[];
  priorities: MhdTaskPriorityOption[];
  assignableUsers: MhdTaskAssignableUser[];
  filters: MhdTaskListFilters;
  onChange: (filters: MhdTaskListFilters) => void;
}

export function MhdTaskFilterBar({ companies, statuses, priorities, assignableUsers, filters, onChange }: MhdTaskFilterBarProps) {
  return (
    <MhdCard className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <MhdFilterSelect label="Company" value={filters.companyId} onChange={(event) => onChange({ ...filters, companyId: event.target.value })}>
        <option value="ALL">All companies</option>
        {companies.map((company) => <option key={company.id} value={company.id}>{company.companyName}</option>)}
      </MhdFilterSelect>
      <MhdFilterSelect label="Status" value={filters.statusId} onChange={(event) => onChange({ ...filters, statusId: event.target.value })}>
        <option value="ALL">All statuses</option>
        {statuses.map((status) => <option key={status.id} value={status.id}>{status.statusName}</option>)}
      </MhdFilterSelect>
      <MhdFilterSelect label="Priority" value={filters.priorityId} onChange={(event) => onChange({ ...filters, priorityId: event.target.value })}>
        <option value="ALL">All priorities</option>
        {priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.priorityName}</option>)}
      </MhdFilterSelect>
      <MhdFilterSelect label="Assigned To" value={filters.assignedUserId} onChange={(event) => onChange({ ...filters, assignedUserId: event.target.value })}>
        <option value="ALL">Anyone</option>
        {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
      </MhdFilterSelect>
      <label className="flex flex-col gap-1 lg:col-span-2">
        <span className="text-xs font-medium text-muted-foreground">Search</span>
        <input
          className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={filters.searchTerm}
          onChange={(event) => onChange({ ...filters, searchTerm: event.target.value })}
          placeholder="Search title, company, reference"
        />
      </label>
    </MhdCard>
  );
}
