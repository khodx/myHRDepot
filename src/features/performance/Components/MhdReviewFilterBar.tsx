import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import {
  MHD_REVIEW_STATUSES,
  MHD_REVIEW_TYPES,
  type MhdPerformanceOption,
  type MhdReviewBoardFilters,
  mhdFormatReviewStatus,
  mhdFormatReviewType,
} from '../Types';

interface Props {
  filters: MhdReviewBoardFilters;
  onChange: (filters: MhdReviewBoardFilters) => void;
  companies: MhdPerformanceOption[];
  people: MhdPerformanceOption[];
  reviewers: MhdPerformanceOption[];
}

export function MhdReviewFilterBar({ filters, onChange, companies, people, reviewers }: Props) {
  function update(patch: Partial<MhdReviewBoardFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <MhdFilterBar
      onClear={() =>
        onChange({
          companyId: companies.length > 0 ? 'ALL' : filters.companyId,
          personId: 'ALL',
          reviewerUserId: 'ALL',
          reviewType: 'ALL',
          status: 'ALL',
          searchTerm: '',
          dueFrom: '',
          dueTo: '',
        })
      }
    >
      <MhdFilterInput
        id="mhd-review-filter-search"
        type="search"
        label="Search"
        value={filters.searchTerm}
        onChange={(event) => update({ searchTerm: event.target.value })}
        placeholder="Person, reviewer, or reference"
      />

      {companies.length > 0 ? (
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Company
          </span>
          <MhdSearchableSelect
            id="mhd-review-filter-company"
            options={[
              { id: 'ALL', label: 'All companies' },
              ...companies.map((company) => ({ id: company.id, label: company.label })),
            ]}
            value={filters.companyId}
            onChange={(companyId) =>
              update({ companyId: companyId as MhdReviewBoardFilters['companyId'] })
            }
            placeholder="All companies"
            emptyMessage="No companies match your search."
          />
        </label>
      ) : null}

      <MhdFilterSelect
        label="Person"
        id="mhd-review-filter-person"
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
        label="Reviewer"
        id="mhd-review-filter-reviewer"
        value={filters.reviewerUserId}
        onChange={(event) => update({ reviewerUserId: event.target.value })}
      >
        <option value="ALL">All reviewers</option>
        {reviewers.map((reviewer) => (
          <option key={reviewer.id} value={reviewer.id}>
            {reviewer.label}
          </option>
        ))}
      </MhdFilterSelect>

      <MhdFilterSelect
        label="Type"
        id="mhd-review-filter-type"
        value={filters.reviewType}
        onChange={(event) =>
          update({ reviewType: event.target.value as MhdReviewBoardFilters['reviewType'] })
        }
      >
        <option value="ALL">All types</option>
        {MHD_REVIEW_TYPES.map((type) => (
          <option key={type} value={type}>
            {mhdFormatReviewType(type)}
          </option>
        ))}
      </MhdFilterSelect>

      <MhdFilterSelect
        label="Status"
        id="mhd-review-filter-status"
        value={filters.status}
        onChange={(event) =>
          update({ status: event.target.value as MhdReviewBoardFilters['status'] })
        }
      >
        <option value="ALL">All statuses</option>
        {MHD_REVIEW_STATUSES.map((status) => (
          <option key={status} value={status}>
            {mhdFormatReviewStatus(status)}
          </option>
        ))}
      </MhdFilterSelect>

      <MhdFilterInput
        id="mhd-review-filter-due-from"
        type="date"
        label="Due From"
        value={filters.dueFrom}
        onChange={(event) => update({ dueFrom: event.target.value })}
      />

      <MhdFilterInput
        id="mhd-review-filter-due-to"
        type="date"
        label="Due To"
        value={filters.dueTo}
        onChange={(event) => update({ dueTo: event.target.value })}
      />
    </MhdFilterBar>
  );
}
