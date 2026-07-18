import { Search } from 'lucide-react';
import {
  MHD_ACTIVITY_STATUSES,
  MHD_ACTIVITY_TYPES,
  type MhdActivityBoardFilters,
  type MhdActivityOption,
  mhdFormatActivityStatus,
  mhdFormatActivityType,
} from '../Types';

interface Props {
  filters: MhdActivityBoardFilters;
  onChange: (filters: MhdActivityBoardFilters) => void;
  companies: MhdActivityOption[];
  people: MhdActivityOption[];
  tasks: MhdActivityOption[];
}

export function MhdActivityFilterBar({ filters, onChange, companies, people, tasks }: Props) {
  function update(patch: Partial<MhdActivityBoardFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Search</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            value={filters.searchTerm}
            onChange={(event) => update({ searchTerm: event.target.value })}
            placeholder="Title, description, or reference…"
            className="w-full rounded border py-2 pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      {companies.length > 0 ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Company</label>
          <select
            value={filters.companyId}
            onChange={(event) => update({ companyId: event.target.value as MhdActivityBoardFilters['companyId'] })}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="ALL">All companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Person</label>
        <select
          value={filters.personId}
          onChange={(event) => update({ personId: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">All people</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Type</label>
        <select
          value={filters.activityType}
          onChange={(event) => update({ activityType: event.target.value as MhdActivityBoardFilters['activityType'] })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">All types</option>
          {MHD_ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {mhdFormatActivityType(type)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Status</label>
        <select
          value={filters.status}
          onChange={(event) => update({ status: event.target.value as MhdActivityBoardFilters['status'] })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_ACTIVITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatActivityStatus(status)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Linked Task</label>
        <select
          value={filters.taskId}
          onChange={(event) => update({ taskId: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">Any / none</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => update({ from: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(event) => update({ to: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            companyId: companies.length > 0 ? 'ALL' : filters.companyId,
            personId: 'ALL',
            taskId: 'ALL',
            activityType: 'ALL',
            status: 'ALL',
            searchTerm: '',
            from: '',
            to: '',
          })
        }
        className="rounded border px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
      >
        Clear
      </button>
    </div>
  );
}
