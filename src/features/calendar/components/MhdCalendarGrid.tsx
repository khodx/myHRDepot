import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Link } from 'react-router-dom';
import type { MhdCalendarEvent, MhdCalendarSourceType, MhdCalendarView } from '../Types';
import { mhdFormatCalendarSourceType } from '../Types';

interface Props {
  anchorDate: Date;
  view: MhdCalendarView;
  events: MhdCalendarEvent[];
}

const SOURCE_ACCENT_CLASSES: Record<MhdCalendarSourceType, string> = {
  TASK: 'border-l-blue-500',
  ACTIVITY: 'border-l-emerald-500',
  LEAVE: 'border-l-amber-500',
  ACCOMMODATION: 'border-l-violet-500',
  MILEAGE: 'border-l-sky-500',
  FORM: 'border-l-rose-500',
};

export function mhdCalendarRangeForView(anchorDate: Date, view: MhdCalendarView) {
  if (view === 'AGENDA') {
    return {
      start: anchorDate,
      end: addDays(anchorDate, 30),
    };
  }

  if (view === 'WEEK') {
    return {
      start: startOfWeek(anchorDate),
      end: endOfWeek(anchorDate),
    };
  }

  return {
    start: startOfWeek(startOfMonth(anchorDate)),
    end: endOfWeek(endOfMonth(anchorDate)),
  };
}

export function MhdCalendarGrid({ anchorDate, view, events }: Props) {
  if (view === 'AGENDA') {
    return <MhdCalendarAgenda anchorDate={anchorDate} events={events} />;
  }

  return <MhdCalendarDayGrid anchorDate={anchorDate} view={view} events={events} />;
}

function MhdCalendarDayGrid({ anchorDate, view, events }: Props) {
  const range = mhdCalendarRangeForView(anchorDate, view);
  const days = eachDayOfInterval(range);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-3 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsForDay(events, day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 border-b border-r border-border p-2 ${
                  isSameMonth(day, anchorDate) || view === 'WEEK' ? 'bg-card' : 'bg-muted/25'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      isSameDay(day, new Date())
                        ? 'rounded-full bg-accent px-2 py-0.5 text-white'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <span className="sr-only">{format(day, 'EEEE, MMMM d')}</span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <MhdCalendarEventChip
                      key={`${event.eventId}-${format(day, 'yyyy-MM-dd')}`}
                      event={event}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MhdCalendarAgenda({ anchorDate, events }: Pick<Props, 'anchorDate' | 'events'>) {
  const range = mhdCalendarRangeForView(anchorDate, 'AGENDA');
  const days = eachDayOfInterval(range);

  return (
    <div className="divide-y divide-border">
      {days.map((day) => {
        const dayEvents = eventsForDay(events, day);
        return (
          <section key={day.toISOString()} className="grid gap-3 p-4 md:grid-cols-[180px_1fr]">
            <h2 className="text-sm font-semibold text-foreground">{format(day, 'EEE, MMM d')}</h2>
            {dayEvents.length > 0 ? (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <MhdCalendarAgendaRow
                    key={`${event.eventId}-${format(day, 'yyyy-MM-dd')}`}
                    event={event}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No events</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MhdCalendarEventChip({ event }: { event: MhdCalendarEvent }) {
  return (
    <Link
      to={event.linkPath}
      title={`${event.title} - ${event.personName}`}
      className={`block rounded border border-border border-l-4 bg-background px-2 py-1 text-xs shadow-sm hover:border-accent hover:text-accent ${SOURCE_ACCENT_CLASSES[event.sourceType]}`}
    >
      <span className="block truncate font-semibold">{event.title}</span>
      <span className="block truncate text-muted-foreground">{event.personName}</span>
    </Link>
  );
}

function MhdCalendarAgendaRow({ event }: { event: MhdCalendarEvent }) {
  return (
    <Link
      to={event.linkPath}
      className={`block rounded-md border border-border border-l-4 bg-background p-3 hover:border-accent ${SOURCE_ACCENT_CLASSES[event.sourceType]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground">{event.title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {mhdFormatCalendarSourceType(event.sourceType)}
        </span>
        {event.status ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {event.status}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{event.personName}</div>
    </Link>
  );
}

function eventsForDay(events: MhdCalendarEvent[], day: Date): MhdCalendarEvent[] {
  return events
    .filter((event) => eventOverlapsDay(event, day))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.title.localeCompare(b.title));
}

function eventOverlapsDay(event: MhdCalendarEvent, day: Date): boolean {
  const start = parseISO(event.eventDate);
  const end = event.eventEnd ? parseISO(event.eventEnd) : start;

  return isWithinInterval(day, { start, end });
}
