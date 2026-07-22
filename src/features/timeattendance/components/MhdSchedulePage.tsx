import { useMemo, useState } from 'react';
import { mhdCanMutateAttendance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAssignScheduleTemplate,
  useMhdAttendancePeople,
  useMhdCompanyHolidays,
  useMhdGenerateShifts,
  useMhdScheduleAssignments,
  useMhdScheduleTemplates,
  useMhdScheduledShifts,
} from '../Hook';
import { mhdFormatClassification, mhdFormatOccurrenceType } from '../Types';
import { MhdAssignTemplateDialog } from './MhdAssignTemplateDialog';

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * `/schedule` route entry.
 *
 * Privileged users (Platform Admin / HR Partner / Client Admin) manage templates
 * and assignments and generate shifts for anyone; an employee (Client User) sees
 * their own shifts, read-only. Both use the same `mhd_schedule_list_shifts`
 * contract, which carries the subject branch — the employee view is a narrower
 * query, not a filtered-down copy of a wider one.
 *
 * Regeneration never clobbers hand-edited days: only rows sourced GENERATED are
 * replaced, which is why the calendar marks the others.
 *
 * Viewer never reaches here — the router guard (mhdRouteAccess) excludes it.
 */
export function MhdSchedulePage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPrivileged = mhdCanMutateAttendance(roles);
  const selfPersonId = profile?.personId ?? null;

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading schedule…</p>
      </div>
    );
  }

  return (
    <MhdScheduleBoard
      companyId={companyId}
      isPrivileged={isPrivileged}
      selfPersonId={selfPersonId}
    />
  );
}

interface BoardProps {
  companyId: string;
  isPrivileged: boolean;
  selfPersonId: string | null;
}

function MhdScheduleBoard({ companyId, isPrivileged, selfPersonId }: BoardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [rangeStart, setRangeStart] = useState(today);
  const [personId, setPersonId] = useState<string | null>(selfPersonId);
  const [assignTemplate, setAssignTemplate] = useState<{ id: string; name: string } | null>(null);

  const rangeEnd = useMemo(() => addDays(rangeStart, 27), [rangeStart]);

  const templates = useMhdScheduleTemplates(isPrivileged ? companyId : null);
  const people = useMhdAttendancePeople(isPrivileged ? companyId : null);
  const assignments = useMhdScheduleAssignments(personId);
  const shifts = useMhdScheduledShifts(personId, rangeStart, rangeEnd);
  const holidays = useMhdCompanyHolidays(companyId);

  const assignTemplateMutation = useMhdAssignScheduleTemplate();
  const generateShifts = useMhdGenerateShifts();

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person: { id: string; firstName?: string; lastName?: string }) => ({
        id: person.id,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  const currentAssignment = (assignments.data ?? []).find(
    (assignment) => assignment.effectiveTo === null,
  );

  async function handleAssign(effectiveFrom: string, note: string | null) {
    if (!personId || !assignTemplate) return;
    await assignTemplateMutation.mutateAsync({
      personId,
      templateId: assignTemplate.id,
      effectiveFrom,
      note,
    });
    setAssignTemplate(null);
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">Schedule</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {isPrivileged
            ? 'Work patterns, assignments and the shift calendar.'
            : 'Your scheduled shifts.'}
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        {isPrivileged ? (
          <div>
            <label htmlFor="person" className="block text-xs uppercase tracking-wide text-neutral-500">
              Employee
            </label>
            <select
              id="person"
              value={personId ?? ''}
              onChange={(event) => setPersonId(event.target.value || null)}
              className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select an employee…</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="rangeStart" className="block text-xs uppercase tracking-wide text-neutral-500">
            From
          </label>
          <input
            id="rangeStart"
            type="date"
            value={rangeStart}
            onChange={(event) => setRangeStart(event.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </div>

        {isPrivileged && personId ? (
          <button
            type="button"
            disabled={generateShifts.isPending}
            onClick={() =>
              void generateShifts.mutateAsync({
                personId,
                from: rangeStart,
                to: addDays(rangeStart, 90),
              })
            }
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
          >
            {generateShifts.isPending ? 'Generating…' : 'Generate 90 days'}
          </button>
        ) : null}
      </div>

      {isPrivileged && personId ? (
        <section className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">Assigned pattern</h2>
          {currentAssignment ? (
            <p className="mt-1 text-sm text-neutral-800">
              {currentAssignment.templateName}{' '}
              <span className="text-neutral-500">since {currentAssignment.effectiveFrom}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">No pattern assigned.</p>
          )}

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <select
              id="assignTemplate"
              value=""
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              onChange={(event) => {
                const templateId = event.target.value;
                if (!templateId) return;
                const template = (templates.data ?? []).find((item) => item.id === templateId);
                setAssignTemplate({ id: templateId, name: template?.templateName ?? 'pattern' });
                event.target.value = '';
              }}
            >
              <option value="">Assign a pattern…</option>
              {(templates.data ?? [])
                .filter((template) => template.isActive)
                .map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateName} ({template.totalWeeklyHours}h/week)
                  </option>
                ))}
            </select>
          </div>

          {/* Assignments are historical: a new one closes the old rather than
              rewriting it, so shifts already generated keep resolving against
              the pattern in force when they were made. */}
          {(assignments.data ?? []).length > 1 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-neutral-500">Pattern history</summary>
              <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                {(assignments.data ?? []).map((assignment) => (
                  <li key={assignment.id}>
                    {assignment.templateName}: {assignment.effectiveFrom} →{' '}
                    {assignment.effectiveTo ?? 'current'}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="text-base font-semibold text-neutral-900">
          Shifts {rangeStart} → {rangeEnd}
        </h2>
        {!personId ? (
          <p className="mt-2 text-sm text-neutral-500">Select an employee to see their calendar.</p>
        ) : shifts.isLoading ? (
          <p className="mt-2 text-sm text-neutral-500">Loading…</p>
        ) : (shifts.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No shifts in this range. {isPrivileged ? 'Generate them from the assigned pattern.' : ''}
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Day</th>
                  <th className="py-2 pr-4 font-medium">Hours</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 font-medium">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {(shifts.data ?? []).map((shift) => {
                  const weekday = new Date(`${shift.shiftDate}T00:00:00Z`).getUTCDay();
                  return (
                    <tr key={shift.id} className="border-b border-neutral-100 text-neutral-800">
                      <td className="py-2 pr-4 whitespace-nowrap">{shift.shiftDate}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-neutral-500">
                        {DAY_NAMES[weekday]}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {shift.startTime}–{shift.endTime}
                        {shift.unpaidBreakMinutes > 0 ? (
                          <span className="ml-1 text-xs text-neutral-500">
                            ({shift.unpaidBreakMinutes}m break)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {shift.source === 'GENERATED' ? (
                          <span className="text-xs text-neutral-500">From pattern</span>
                        ) : (
                          <span
                            className="text-xs font-medium text-amber-700"
                            title={shift.overrideReason ?? undefined}
                          >
                            {shift.source === 'OVERRIDE' ? 'Overridden' : 'Manual'}
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {shift.occurrenceType && shift.classification ? (
                          <span className="text-xs text-neutral-700">
                            {mhdFormatOccurrenceType(shift.occurrenceType)} ·{' '}
                            {mhdFormatClassification(shift.classification)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isPrivileged ? (
        <section>
          <h2 className="text-base font-semibold text-neutral-900">Company holidays</h2>
          {(holidays.data ?? []).length === 0 ? (
            <p className="mt-1 text-sm text-neutral-500">
              None recorded. Shift generation skips holidays, so an absence cannot be raised against
              one.
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-sm text-neutral-700">
              {(holidays.data ?? []).map((holiday) => (
                <li key={holiday.id}>
                  {holiday.holidayDate} — {holiday.holidayName}
                  {holiday.isPaid ? '' : ' (unpaid)'}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {isPrivileged && personId && assignTemplate ? (
        <MhdAssignTemplateDialog
          templateName={assignTemplate.name}
          defaultDate={today}
          isSubmitting={assignTemplateMutation.isPending}
          onSubmit={handleAssign}
          onCancel={() => setAssignTemplate(null)}
        />
      ) : null}
    </div>
  );
}
