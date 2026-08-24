import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
import { mhdToIsoDateString } from '@/utils/mhdDateFormat';

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return mhdToIsoDateString(date);
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
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
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
  const today = mhdToIsoDateString();
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
    <div className="space-y-6">
      <MhdPageHeader
        title="Schedule"
        description={
          isPrivileged
            ? 'Work patterns, assignments and the shift calendar.'
            : 'Your scheduled shifts.'
        }
      />

      <MhdCard className="flex flex-wrap items-end gap-3">
        {isPrivileged ? (
          <MhdFilterSelect
            label="Employee"
            id="person"
            value={personId ?? ''}
            onChange={(event) => setPersonId(event.target.value || null)}
          >
            <option value="">Select an employee…</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}

        <label htmlFor="rangeStart" className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <MhdDateField
            id="rangeStart"
            value={rangeStart}
            onChange={(nextValue) => setRangeStart(nextValue)}
          />
        </label>

        {isPrivileged && personId ? (
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            disabled={generateShifts.isPending}
            onClick={() =>
              void generateShifts.mutateAsync({
                personId,
                from: rangeStart,
                to: addDays(rangeStart, 90),
              })
            }
          >
            {generateShifts.isPending ? 'Generating…' : 'Generate 90 days'}
          </Button>
        ) : null}
      </MhdCard>

      {isPrivileged && personId ? (
        <MhdCard>
          <h2 className="text-sm font-medium text-foreground">Assigned pattern</h2>
          {currentAssignment ? (
            <p className="mt-1 text-sm text-foreground">
              {currentAssignment.templateName}{' '}
              <span className="text-muted-foreground">since {currentAssignment.effectiveFrom}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No pattern assigned.</p>
          )}

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <select
              id="assignTemplate"
              value=""
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Pattern history
              </summary>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {(assignments.data ?? []).map((assignment) => (
                  <li key={assignment.id}>
                    {assignment.templateName}: {assignment.effectiveFrom} →{' '}
                    {assignment.effectiveTo ?? 'current'}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </MhdCard>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">
          Shifts {rangeStart} → {rangeEnd}
        </h2>
        {!personId ? (
          <p className="text-sm text-muted-foreground">Select an employee to see their calendar.</p>
        ) : shifts.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (shifts.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shifts in this range.{' '}
            {isPrivileged ? 'Generate them from the assigned pattern.' : ''}
          </p>
        ) : (
          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Date</MhdTh>
                  <MhdTh>Day</MhdTh>
                  <MhdTh>Hours</MhdTh>
                  <MhdTh>Source</MhdTh>
                  <MhdTh>Attendance</MhdTh>
                </tr>
              </thead>
              <tbody>
                {(shifts.data ?? []).map((shift) => {
                  const weekday = new Date(`${shift.shiftDate}T00:00:00Z`).getUTCDay();
                  return (
                    <MhdTr key={shift.id}>
                      <MhdTd className="whitespace-nowrap">{shift.shiftDate}</MhdTd>
                      <MhdTd className="whitespace-nowrap text-muted-foreground">
                        {DAY_NAMES[weekday]}
                      </MhdTd>
                      <MhdTd className="whitespace-nowrap">
                        {shift.startTime}–{shift.endTime}
                        {shift.unpaidBreakMinutes > 0 ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({shift.unpaidBreakMinutes}m break)
                          </span>
                        ) : null}
                      </MhdTd>
                      <MhdTd className="whitespace-nowrap">
                        {shift.source === 'GENERATED' ? (
                          <span className="text-xs text-muted-foreground">From pattern</span>
                        ) : (
                          <span
                            className="text-xs font-medium text-amber-700"
                            title={shift.overrideReason ?? undefined}
                          >
                            {shift.source === 'OVERRIDE' ? 'Overridden' : 'Manual'}
                          </span>
                        )}
                      </MhdTd>
                      <MhdTd>
                        {shift.occurrenceType && shift.classification ? (
                          <span className="text-xs text-foreground">
                            {mhdFormatOccurrenceType(shift.occurrenceType)} ·{' '}
                            {mhdFormatClassification(shift.classification)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </MhdTd>
                    </MhdTr>
                  );
                })}
              </tbody>
            </MhdTable>
          </MhdCard>
        )}
      </section>

      {isPrivileged ? (
        <section>
          <h2 className="text-base font-semibold text-foreground">Company holidays</h2>
          {(holidays.data ?? []).length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              None recorded. Shift generation skips holidays, so an absence cannot be raised against
              one.
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-sm text-foreground">
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
