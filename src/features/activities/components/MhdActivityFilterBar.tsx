import { Search } from 'lucide-react';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
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

const DATE_INPUT_CLASSES =
  'rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdActivityFilterBar({ filters, onChange, companies, people, tasks }: Props) {
  function update(patch: Partial<MhdActivityBoardFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-56 flex-1">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Search</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={filters.searchTerm}
            onChange={(event) => update({ searchTerm: event.target.value })}
            placeholder="Title, description, or reference…"
            className="w-full rounded-md border border-border bg-card py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
      </label>

      {companies.length > 0 ? (
        <MhdFilterSelect
          label="Company"
          value={filters.companyId}
          onChange={(event) =>
            update({ companyId: event.target.value as MhdActivityBoardFilters['companyId'] })
          }
        >
          <option value="ALL">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.label}
            </option>
          ))}
        </MhdFilterSelect>
      ) : null}

      <MhdFilterSelect
        label="Person"
        value={filters.personId}
        onChange={(event) => update({ personId: event.target.value })}
      >
        <option value="ALL">All people</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.label}
          </option>
        ))}
      </MhdFilterSelect>

      <MhdFilterSelect
        label="Type"
        value={filters.activityType}
        onChange={(event) =>
          update({ activityType: event.target.value as MhdActivityBoardFilters['activityType'] })
        }
      >
        <option value="ALL">All types</option>
        {MHD_ACTIVITY_TYPES.map((type) => (
          <option key={type} value={type}>
            {mhdFormatActivityType(type)}
          </option>
        ))}
      </MhdFilterSelect>

      <MhdFilterSelect
        label="Status"
        value={filters.status}
        onChange={(event) =>
          update({ status: event.target.value as MhdActivityBoardFilters['status'] })
        }
      >
        <option value="ALL">All statuses</option>
        {MHD_ACTIVITY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {mhdFormatActivityStatus(status)}
          </option>
        ))}
      </MhdFilterSelect>

      <MhdFilterSelect
        label="Linked Task"
        value={filters.taskId}
        onChange={(event) => update({ taskId: event.target.value })}
      >
        <option value="ALL">Any / none</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.label}
          </option>
        ))}
      </MhdFilterSelect>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">From</span>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => update({ from: event.target.value })}
          className={DATE_INPUT_CLASSES}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">To</span>
        <input
          type="date"
          value={filters.to}
          onChange={(event) => update({ to: event.target.value })}
          className={DATE_INPUT_CLASSES}
        />
      </label>

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
        className="pb-2 text-[13px] font-medium text-accent hover:text-accent-hover"
      >
        Clear
      </button>
    </div>
  );
}
