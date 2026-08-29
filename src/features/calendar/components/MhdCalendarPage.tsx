import { addMonths, addWeeks, format, subMonths, subWeeks } from 'date-fns';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeoplePicker } from '@/features/people/Hook';
import { useMhdCalendarEvents } from '../Hook';
import type { MhdCalendarEvent, MhdCalendarFilters, MhdCalendarView } from '../Types';
import { MhdCalendarEventForm } from './MhdCalendarEventForm';
import { MhdCalendarFilterBar } from './MhdCalendarFilterBar';
import { MhdCalendarGrid, mhdCalendarRangeForView } from './MhdCalendarGrid';

// Scheduling an event "for" someone else, rather than only yourself, is
// reserved to the same privileged set used for HR-facing calendar
// management elsewhere in the app (mirrors the Workplace Safety /
// Contractor Classification role set) -- the backing RPC enforces the real
// boundary via mhd_list_visible_people_scope(); this only decides whether
// the picker renders at all.
const MHD_CALENDAR_SCHEDULE_FOR_OTHERS_ROLES = ['Platform Admin', 'HR Partner', 'HR Admin', 'Client Admin'];

const DEFAULT_FILTERS: MhdCalendarFilters = {
  companyId: null,
  personIds: [],
  sourceTypes: [],
};

export function MhdCalendarPage() {
  const { profile, roles } = useMhdAuth();
  const canSelectCompany = mhdIsPlatformAdmin(roles);
  const canScheduleForOthers = roles.some((role) => MHD_CALENDAR_SCHEDULE_FOR_OTHERS_ROLES.includes(role));
  const [filters, setFilters] = useState<MhdCalendarFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<MhdCalendarView>('MONTH');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [eventForm, setEventForm] = useState<{ date?: Date; eventId?: string } | null>(null);

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
        description="A schedule of tasks, activities, leave, accommodations, mileage, form events, and your own events."
        actions={
          <button
            type="button"
            onClick={() => setEventForm({ date: new Date() })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Event
          </button>
        }
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
          <MhdCalendarGrid
            anchorDate={anchorDate}
            view={view}
            events={calendarQuery.data ?? []}
            onAddEvent={(date) => setEventForm({ date })}
            onOpenEvent={(event: MhdCalendarEvent) => setEventForm({ eventId: event.sourceId })}
          />
        )}
      </MhdCard>

      {eventForm ? (
        <MhdCalendarEventForm
          onClose={() => setEventForm(null)}
          initialDate={eventForm.date}
          eventId={eventForm.eventId}
          ownPersonId={profile?.personId ?? null}
          peopleOptions={
            canScheduleForOthers
              ? (peopleQuery.data ?? []).map((person) => ({ id: person.id, label: person.displayName }))
              : []
          }
        />
      ) : null}
    </div>
  );
}
