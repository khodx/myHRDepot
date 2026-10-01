import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRowActionsMenu } from '@/components/ui/MhdRowActionsMenu';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  useMhdAssignScheduleTemplate,
  useMhdAttendanceAccess,
  useMhdAttendancePeople,
  useMhdCompanyHolidays,
  useMhdDeleteHoliday,
  useMhdEndScheduleAssignment,
  useMhdGenerateShifts,
  useMhdOverrideShift,
  useMhdScheduleAssignments,
  useMhdScheduleTemplates,
  useMhdScheduledShifts,
  useMhdUpsertHoliday,
  type MhdAttendanceAccess,
} from '../Hook';
import {
  mhdFormatClassification,
  mhdFormatOccurrenceType,
  type MhdCompanyHoliday,
  type MhdScheduledShift,
} from '../Types';
import { MhdAssignTemplateDialog } from './MhdAssignTemplateDialog';
import { MhdEndAssignmentDialog } from './MhdEndAssignmentDialog';
import { MhdHolidayDialog } from './MhdHolidayDialog';
import { MhdOverrideShiftDialog } from './MhdOverrideShiftDialog';
import { mhdToIsoDateString } from '@/utils/mhdDateFormat';
import { useMhdActionRunner } from '@/utils/useMhdActionRunner';

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return mhdToIsoDateString(date);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * `/schedule` route entry.
 *
 * What renders is decided by the caller's read scope (see useMhdAttendanceAccess,
 * which mirrors the database predicate):
 *
 * - **Privileged** roles manage patterns and assignments, generate and override
 *   shifts, and maintain holidays, for anyone in the company.
 * - **HR Coordinator** reads any employee's schedule but changes nothing.
 * - **A manager** reads their own schedule and their direct reports'.
 * - **Everyone else** reads their own shifts.
 *
 * All of them call the same `mhd_schedule_list_shifts` contract; the employee view is
 * a narrower query, not a filtered-down copy of a wider one.
 *
 * Regeneration never clobbers hand-edited days: only rows sourced GENERATED are
 * replaced, which is why the calendar marks the others.
 *
 * Viewer never reaches here - the router guard (mhdRouteAccess) excludes it.
 */
export function MhdSchedulePage() {
  const access = useMhdAttendanceAccess();

  if (!access.companyId || access.isScopeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
      </div>
    );
  }

  return <MhdScheduleBoard access={access} companyId={access.companyId} />;
}

interface BoardProps {
  access: MhdAttendanceAccess;
  companyId: string;
}

function MhdScheduleBoard({ access, companyId }: BoardProps) {
  const { canMutate, scope, selfPersonId, teamMembers } = access;
  const today = mhdToIsoDateString();
  const [rangeStart, setRangeStart] = useState(today);
  const [personId, setPersonId] = useState<string | null>(selfPersonId);
  const [assignTemplate, setAssignTemplate] = useState<{ id: string; name: string } | null>(null);
  const [endingAssignment, setEndingAssignment] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<MhdScheduledShift | null>(null);
  const [holidayDialog, setHolidayDialog] = useState<{ holiday: MhdCompanyHoliday | null } | null>(
    null,
  );
  const [holidayDeleteTarget, setHolidayDeleteTarget] = useState<MhdCompanyHoliday | null>(null);
  const { error, run } = useMhdActionRunner();

  const rangeEnd = useMemo(() => addDays(rangeStart, 27), [rangeStart]);

  const templates = useMhdScheduleTemplates(canMutate ? companyId : null);
  const people = useMhdAttendancePeople(scope === 'company' ? companyId : null);
  const assignments = useMhdScheduleAssignments(personId);
  const shifts = useMhdScheduledShifts(personId, rangeStart, rangeEnd);
  const holidays = useMhdCompanyHolidays(companyId);

  const assignTemplateMutation = useMhdAssignScheduleTemplate();
  const endAssignment = useMhdEndScheduleAssignment();
  const generateShifts = useMhdGenerateShifts();
  const overrideShift = useMhdOverrideShift();
  const upsertHoliday = useMhdUpsertHoliday(companyId);
  const deleteHoliday = useMhdDeleteHoliday(companyId);

  const peopleOptions = useMemo(
    () =>
      scope === 'company'
        ? (people.data ?? []).map(
            (person: { id: string; firstName?: string; lastName?: string }) => ({
              id: person.id,
              displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
            }),
          )
        : teamMembers,
    [scope, people.data, teamMembers],
  );

  const currentAssignment = (assignments.data ?? []).find(
    (assignment) => assignment.effectiveTo === null,
  );

  // Dialog submit handlers return void; `run` reports success as a boolean.
  async function submitAction(action: () => Promise<unknown>, fallback: string): Promise<void> {
    await run(action, fallback);
  }

  const pickerVisible = scope !== 'self';

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Schedule"
        description={
          canMutate
            ? 'Work patterns, assignments and the shift calendar.'
            : scope === 'company'
              ? 'Work schedules across the company (read-only).'
              : scope === 'team'
                ? 'Your schedule and your direct reports’ schedules.'
                : 'Your scheduled shifts.'
        }
        actions={
          canMutate ? (
            <Link
              to="/schedule/templates"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              Manage Patterns
            </Link>
          ) : undefined
        }
      />

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <MhdCard className="flex flex-wrap items-end gap-3">
        {pickerVisible ? (
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

        {canMutate && personId ? (
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            disabled={generateShifts.isPending}
            onClick={() =>
              void run(
                () =>
                  generateShifts.mutateAsync({
                    personId,
                    from: rangeStart,
                    to: addDays(rangeStart, 90),
                  }),
                'Unable to generate shifts.',
              )
            }
          >
            {generateShifts.isPending ? 'Generating…' : 'Generate 90 Days'}
          </Button>
        ) : null}
      </MhdCard>

      {personId && (canMutate || (assignments.data ?? []).length > 0) ? (
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

          {canMutate ? (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <select
                id="assignTemplate"
                aria-label="Assign a pattern"
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
              {currentAssignment ? (
                <Button
                  variant="secondary"
                  className="px-3 py-1.5"
                  onClick={() => setEndingAssignment(true)}
                >
                  End Assignment
                </Button>
              ) : null}
            </div>
          ) : null}

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
            No shifts in this range. {canMutate ? 'Generate them from the assigned pattern.' : ''}
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
                  {canMutate ? <MhdTh /> : null}
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
                      {canMutate ? (
                        <MhdTd className="text-right">
                          <MhdRowActionsMenu
                            triggerLabel={`Actions for ${shift.shiftDate}`}
                            actions={[
                              {
                                key: 'override',
                                label: 'Override Shift',
                                onSelect: () => setOverrideTarget(shift),
                              },
                            ]}
                          />
                        </MhdTd>
                      ) : null}
                    </MhdTr>
                  );
                })}
              </tbody>
            </MhdTable>
          </MhdCard>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Company holidays</h2>
          {canMutate ? (
            <Button
              variant="secondary"
              className="px-3 py-1.5"
              onClick={() => setHolidayDialog({ holiday: null })}
            >
              Add Holiday
            </Button>
          ) : null}
        </div>
        {(holidays.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None recorded. Shift generation skips holidays, so an absence cannot be raised against
            one.
          </p>
        ) : (
          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Date</MhdTh>
                  <MhdTh>Holiday</MhdTh>
                  <MhdTh>Paid</MhdTh>
                  {canMutate ? <MhdTh /> : null}
                </tr>
              </thead>
              <tbody>
                {(holidays.data ?? []).map((holiday) => (
                  <MhdTr key={holiday.id}>
                    <MhdTd className="whitespace-nowrap">{holiday.holidayDate}</MhdTd>
                    <MhdTd>{holiday.holidayName}</MhdTd>
                    <MhdTd>{holiday.isPaid ? 'Paid' : 'Unpaid'}</MhdTd>
                    {canMutate ? (
                      <MhdTd className="text-right">
                        <MhdRowActionsMenu
                          triggerLabel={`Actions for ${holiday.holidayName}`}
                          actions={[
                            {
                              key: 'edit',
                              label: 'Edit',
                              onSelect: () => setHolidayDialog({ holiday }),
                            },
                            {
                              key: 'delete',
                              label: 'Delete',
                              destructive: true,
                              onSelect: () => setHolidayDeleteTarget(holiday),
                            },
                          ]}
                        />
                      </MhdTd>
                    ) : null}
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
          </MhdCard>
        )}
      </section>

      {canMutate && personId && assignTemplate ? (
        <MhdAssignTemplateDialog
          templateName={assignTemplate.name}
          defaultDate={today}
          isSubmitting={assignTemplateMutation.isPending}
          onSubmit={(effectiveFrom, note) =>
            submitAction(async () => {
              await assignTemplateMutation.mutateAsync({
                personId,
                templateId: assignTemplate.id,
                effectiveFrom,
                note,
              });
              setAssignTemplate(null);
            }, 'Unable to assign the pattern.')
          }
          onCancel={() => setAssignTemplate(null)}
        />
      ) : null}

      {canMutate && endingAssignment && currentAssignment ? (
        <MhdEndAssignmentDialog
          assignmentId={currentAssignment.id}
          templateName={currentAssignment.templateName}
          effectiveFrom={currentAssignment.effectiveFrom}
          defaultDate={today}
          isSubmitting={endAssignment.isPending}
          onSubmit={(assignmentId, effectiveTo) =>
            submitAction(async () => {
              await endAssignment.mutateAsync({ assignmentId, effectiveTo });
              setEndingAssignment(false);
            }, 'Unable to end the assignment.')
          }
          onCancel={() => setEndingAssignment(false)}
        />
      ) : null}

      {canMutate && overrideTarget ? (
        <MhdOverrideShiftDialog
          shift={overrideTarget}
          isSubmitting={overrideShift.isPending}
          onSubmit={(input) =>
            submitAction(async () => {
              await overrideShift.mutateAsync(input);
              setOverrideTarget(null);
            }, 'Unable to override the shift.')
          }
          onCancel={() => setOverrideTarget(null)}
        />
      ) : null}

      {canMutate && holidayDialog ? (
        <MhdHolidayDialog
          companyId={companyId}
          holiday={holidayDialog.holiday}
          defaultDate={today}
          isSubmitting={upsertHoliday.isPending}
          onSubmit={(input) =>
            submitAction(async () => {
              await upsertHoliday.mutateAsync(input);
              setHolidayDialog(null);
            }, 'Unable to save the holiday.')
          }
          onCancel={() => setHolidayDialog(null)}
        />
      ) : null}

      {canMutate && holidayDeleteTarget ? (
        <MhdModal
          title="Delete Holiday"
          onClose={() => setHolidayDeleteTarget(null)}
          className="relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl"
        >
          <h2 className="text-base font-semibold text-foreground">Delete Holiday</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Delete {holidayDeleteTarget.holidayName} on {holidayDeleteTarget.holidayDate}? Future
            shift generation will schedule that day again. Shifts already generated are not changed.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5"
              onClick={() => setHolidayDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="px-3 py-1.5"
              disabled={deleteHoliday.isPending}
              onClick={() =>
                void run(async () => {
                  await deleteHoliday.mutateAsync(holidayDeleteTarget.id);
                  setHolidayDeleteTarget(null);
                }, 'Unable to delete the holiday.')
              }
            >
              {deleteHoliday.isPending ? 'Deleting…' : 'Delete Holiday'}
            </Button>
          </div>
        </MhdModal>
      ) : null}
    </div>
  );
}
