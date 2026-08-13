import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdFilterBar } from '@/components/ui/MhdFilterBar';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import type { MhdCalendarFilters, MhdCalendarSourceType, MhdCalendarView } from '../Types';
import { MHD_CALENDAR_SOURCE_TYPES, mhdFormatCalendarSourceType } from '../Types';

interface MhdCalendarFilterOption {
  id: string;
  label: string;
}

interface Props {
  filters: MhdCalendarFilters;
  onChange: (filters: MhdCalendarFilters) => void;
  view: MhdCalendarView;
  onViewChange: (view: MhdCalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  companies: MhdCalendarFilterOption[];
  people: MhdCalendarFilterOption[];
  canSelectCompany: boolean;
  selectedCompanyId: string | null;
}

export function MhdCalendarFilterBar({
  filters,
  onChange,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  companies,
  people,
  canSelectCompany,
  selectedCompanyId,
}: Props) {
  function update(patch: Partial<MhdCalendarFilters>) {
    onChange({ ...filters, ...patch });
  }

  function toggleSourceType(sourceType: MhdCalendarSourceType) {
    update({
      sourceTypes: filters.sourceTypes.includes(sourceType)
        ? filters.sourceTypes.filter((type) => type !== sourceType)
        : [...filters.sourceTypes, sourceType],
    });
  }

  return (
    <MhdFilterBar
      className="xl:grid-cols-4"
      onClear={() =>
        onChange({
          companyId: canSelectCompany ? null : filters.companyId,
          personIds: [],
          sourceTypes: [],
        })
      }
    >
      {canSelectCompany ? (
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Company
          </span>
          <select
            value={filters.companyId ?? 'ALL'}
            onChange={(event) =>
              onChange({
                ...filters,
                companyId: event.target.value === 'ALL' ? null : event.target.value,
                personIds: [],
              })
            }
            className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="ALL">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedCompanyId ? (
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            People
          </span>
          <MhdMultiSelectCombobox
            options={people}
            value={filters.personIds}
            onChange={(personIds) => update({ personIds })}
            placeholder="All people"
            emptyMessage="No people match your search."
          />
        </label>
      ) : null}

      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Source Types
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {MHD_CALENDAR_SOURCE_TYPES.map((sourceType) => {
            const selected = filters.sourceTypes.includes(sourceType);
            return (
              <button
                key={sourceType}
                type="button"
                onClick={() => toggleSourceType(sourceType)}
                aria-pressed={selected}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  selected
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-card text-muted-foreground hover:border-accent hover:text-accent'
                }`}
              >
                {mhdFormatCalendarSourceType(sourceType)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          View
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(['MONTH', 'WEEK', 'AGENDA'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onViewChange(option)}
              aria-pressed={view === option}
              className={`rounded-md border px-2.5 py-1.5 text-sm font-semibold ${
                view === option
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-card text-muted-foreground hover:border-accent hover:text-accent'
              }`}
            >
              {option === 'MONTH' ? 'Month' : option === 'WEEK' ? 'Week' : 'Agenda'}
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5">
          <Button variant="secondary" onClick={onPrevious} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="secondary" onClick={onToday}>
            Today
          </Button>
          <Button variant="secondary" onClick={onNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </MhdFilterBar>
  );
}
