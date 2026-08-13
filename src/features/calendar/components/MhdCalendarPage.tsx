import { addMonths, addWeeks, format, subMonths, subWeeks } from 'date-fns';
import { useMemo, useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import { useMhdCalendarEvents } from '../Hook';
import type { MhdCalendarFilters, MhdCalendarView } from '../Types';
import { MhdCalendarFilterBar } from './MhdCalendarFilterBar';
import { MhdCalendarGrid, mhdCalendarRangeForView } from './MhdCalendarGrid';

const DEFAULT_FILTERS: MhdCalendarFilters = {
  companyId: null,
  personIds: [],
  sourceTypes: [],
};

export function MhdCalendarPage() {
  const { profile, roles } = useMhdAuth();
  const canSelectCompany = mhdIsPlatformAdmin(roles);
  const [filters, setFilters] = useState<MhdCalendarFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<MhdCalendarView>('MONTH');
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const selectedCompanyId = canSelectCompany ? filters.companyId : (profile?.companyId ?? null);

  const effectiveFilters = useMemo<MhdCalendarFilters>(
    () => ({
      ...filters,
      companyId: canSelectCompany ? filters.companyId : (profile?.companyId ?? null),
      personIds: selectedCompanyId ? filters.personIds : [],
    }),
    [canSelectCompany, filters, profile?.companyId, selectedCompanyId],
  );

  const range = useMemo(() => mhdCalendarRangeForView(anchorDate, view), [anchorDate, view]);
  const rangeStart = format(range.start, 'yyyy-MM-dd');
  const rangeEnd = format(range.end, 'yyyy-MM-dd');

  const calendarQuery = useMhdCalendarEvents(rangeStart, rangeEnd, effectiveFilters);
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const peopleQuery = useMhdPeoplePicker(selectedCompanyId);

  function handlePrevious() {
    setAnchorDate((current) =>
      view === 'MONTH'
        ? subMonths(current, 1)
        : view === 'WEEK'
          ? subWeeks(current, 1)
          : subWeeks(current, 4),
    );
  }

  function handleNext() {
    setAnchorDate((current) =>
      view === 'MONTH'
        ? addMonths(current, 1)
        : view === 'WEEK'
          ? addWeeks(current, 1)
          : addWeeks(current, 4),
    );
  }

  const companyOptions = canSelectCompany
    ? (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.companyName }))
    : [];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Calendar"
        description="A read-only schedule of tasks, activities, leave, accommodations, mileage, and form events."
      />

      {calendarQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {calendarQuery.error instanceof Error
            ? calendarQuery.error.message
            : 'Unable to load calendar events.'}
        </div>
      ) : null}
      {peopleQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {peopleQuery.error instanceof Error
            ? peopleQuery.error.message
            : 'Unable to load people.'}
        </div>
      ) : null}

      <MhdCalendarFilterBar
        filters={filters}
        onChange={setFilters}
        view={view}
        onViewChange={setView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={() => setAnchorDate(new Date())}
        companies={companyOptions}
        people={(peopleQuery.data ?? []).map((person) => ({
          id: person.id,
          label: person.displayName,
        }))}
        canSelectCompany={canSelectCompany}
        selectedCompanyId={selectedCompanyId}
      />

      <MhdCard className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">
            {view === 'MONTH'
              ? format(anchorDate, 'MMMM yyyy')
              : view === 'WEEK'
                ? `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d, yyyy')}`
                : `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d, yyyy')}`}
          </h2>
        </div>
        {calendarQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading calendar events...
          </div>
        ) : (
          <MhdCalendarGrid anchorDate={anchorDate} view={view} events={calendarQuery.data ?? []} />
        )}
      </MhdCard>
    </div>
  );
}
