import { Search } from 'lucide-react';
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
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="mhd-review-filter-search" className="mb-1 block text-xs font-medium text-neutral-500">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            id="mhd-review-filter-search"
            type="search"
            value={filters.searchTerm}
            onChange={(event) => update({ searchTerm: event.target.value })}
            placeholder="Person, reviewer, or reference…"
            className="w-full rounded border py-2 pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      {companies.length > 0 ? (
        <div>
          <label htmlFor="mhd-review-filter-company" className="mb-1 block text-xs font-medium text-neutral-500">
            Company
          </label>
          <select
            id="mhd-review-filter-company"
            value={filters.companyId}
            onChange={(event) => update({ companyId: event.target.value as MhdReviewBoardFilters['companyId'] })}
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
        <label htmlFor="mhd-review-filter-person" className="mb-1 block text-xs font-medium text-neutral-500">
          Person
        </label>
        <select
          id="mhd-review-filter-person"
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
        <label htmlFor="mhd-review-filter-reviewer" className="mb-1 block text-xs font-medium text-neutral-500">
          Reviewer
        </label>
        <select
          id="mhd-review-filter-reviewer"
          value={filters.reviewerUserId}
          onChange={(event) => update({ reviewerUserId: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">All reviewers</option>
          {reviewers.map((reviewer) => (
            <option key={reviewer.id} value={reviewer.id}>
              {reviewer.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mhd-review-filter-type" className="mb-1 block text-xs font-medium text-neutral-500">
          Type
        </label>
        <select
          id="mhd-review-filter-type"
          value={filters.reviewType}
          onChange={(event) => update({ reviewType: event.target.value as MhdReviewBoardFilters['reviewType'] })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">All types</option>
          {MHD_REVIEW_TYPES.map((type) => (
            <option key={type} value={type}>
              {mhdFormatReviewType(type)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mhd-review-filter-status" className="mb-1 block text-xs font-medium text-neutral-500">
          Status
        </label>
        <select
          id="mhd-review-filter-status"
          value={filters.status}
          onChange={(event) => update({ status: event.target.value as MhdReviewBoardFilters['status'] })}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_REVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatReviewStatus(status)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mhd-review-filter-due-from" className="mb-1 block text-xs font-medium text-neutral-500">
          Due From
        </label>
        <input
          id="mhd-review-filter-due-from"
          type="date"
          value={filters.dueFrom}
          onChange={(event) => update({ dueFrom: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="mhd-review-filter-due-to" className="mb-1 block text-xs font-medium text-neutral-500">
          Due To
        </label>
        <input
          id="mhd-review-filter-due-to"
          type="date"
          value={filters.dueTo}
          onChange={(event) => update({ dueTo: event.target.value })}
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

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
        className="rounded border px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
      >
        Clear
      </button>
    </div>
  );
}
