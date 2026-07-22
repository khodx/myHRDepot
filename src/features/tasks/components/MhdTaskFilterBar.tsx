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
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
      <label className="text-sm font-medium text-slate-700">
        Company
        <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={filters.companyId} onChange={(event) => onChange({ ...filters, companyId: event.target.value })}>
          <option value="ALL">All companies</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.companyName}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Status
        <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={filters.statusId} onChange={(event) => onChange({ ...filters, statusId: event.target.value })}>
          <option value="ALL">All statuses</option>
          {statuses.map((status) => <option key={status.id} value={status.id}>{status.statusName}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Priority
        <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={filters.priorityId} onChange={(event) => onChange({ ...filters, priorityId: event.target.value })}>
          <option value="ALL">All priorities</option>
          {priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.priorityName}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Assigned To
        <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={filters.assignedUserId} onChange={(event) => onChange({ ...filters, assignedUserId: event.target.value })}>
          <option value="ALL">Anyone</option>
          {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">
        Search
        <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={filters.searchTerm} onChange={(event) => onChange({ ...filters, searchTerm: event.target.value })} placeholder="Search title, company, reference" />
      </label>
    </section>
  );
}
