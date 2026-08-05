import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
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
    <MhdFilterBar
      onClear={() =>
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
    >
      <MhdFilterInput
        type="search"
        label="Search"
        value={filters.searchTerm}
        onChange={(event) => update({ searchTerm: event.target.value })}
        placeholder="Title, description, or reference"
      />

      {companies.length > 0 ? (
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Company
          </span>
          <MhdSearchableSelect
            options={[
              { id: 'ALL', label: 'All companies' },
              ...companies.map((company) => ({ id: company.id, label: company.label })),
            ]}
            value={filters.companyId}
            onChange={(companyId) =>
              update({ companyId: companyId as MhdActivityBoardFilters['companyId'] })
            }
            placeholder="All companies"
            emptyMessage="No companies match your search."
          />
        </label>
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

      <MhdFilterInput
        type="date"
        label="From"
        value={filters.from}
        onChange={(event) => update({ from: event.target.value })}
      />

      <MhdFilterInput
        type="date"
        label="To"
        value={filters.to}
        onChange={(event) => update({ to: event.target.value })}
      />
    </MhdFilterBar>
  );
}
