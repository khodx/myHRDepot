import { Search } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
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

const INPUT_CLASSES =
  'rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdReviewFilterBar({ filters, onChange, companies, people, reviewers }: Props) {
  function update(patch: Partial<MhdReviewBoardFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <MhdCard className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
      <label className="flex flex-col gap-1 md:col-span-3 lg:col-span-4">
        <span className="text-xs font-medium text-muted-foreground">Search</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="mhd-review-filter-search"
            type="search"
            value={filters.searchTerm}
            onChange={(event) => update({ searchTerm: event.target.value })}
            placeholder="Person, reviewer, or reference…"
            className={`w-full pl-8 ${INPUT_CLASSES}`}
          />
        </div>
      </label>

      {companies.length > 0 ? (
        <MhdFilterSelect
          label="Company"
          id="mhd-review-filter-company"
          value={filters.companyId}
          onChange={(event) => update({ companyId: event.target.value as MhdReviewBoardFilters['companyId'] })}
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
        onChange={(event) => update({ reviewType: event.target.value as MhdReviewBoardFilters['reviewType'] })}
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
        onChange={(event) => update({ status: event.target.value as MhdReviewBoardFilters['status'] })}
      >
        <option value="ALL">All statuses</option>
        {MHD_REVIEW_STATUSES.map((status) => (
          <option key={status} value={status}>
            {mhdFormatReviewStatus(status)}
          </option>
        ))}
      </MhdFilterSelect>

      <label htmlFor="mhd-review-filter-due-from" className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Due From</span>
        <input
          id="mhd-review-filter-due-from"
          type="date"
          value={filters.dueFrom}
          onChange={(event) => update({ dueFrom: event.target.value })}
          className={INPUT_CLASSES}
        />
      </label>

      <label htmlFor="mhd-review-filter-due-to" className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Due To</span>
        <input
          id="mhd-review-filter-due-to"
          type="date"
          value={filters.dueTo}
          onChange={(event) => update({ dueTo: event.target.value })}
          className={INPUT_CLASSES}
        />
      </label>

      <div className="flex items-end">
        <button
          type="button"
          onClick={() =>
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
          className="pb-2 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Clear
        </button>
      </div>
    </MhdCard>
  );
}
