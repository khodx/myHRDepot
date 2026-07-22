import { useMemo, useState } from 'react';
import { mhdCanMutateAttendance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAdjustPoints,
  useMhdAttendanceOccurrences,
  useMhdAttendancePeople,
  useMhdAttendancePolicy,
  useMhdPointBalance,
  useMhdPointLedger,
  useMhdReassessmentEvents,
  useMhdRecordOccurrence,
  useMhdResolveReassessmentEvent,
  useMhdResolveThresholdEvent,
  useMhdThresholdEvents,
  useMhdVoidOccurrence,
} from '../Hook';
import type { MhdOccurrenceFormValues } from '../Schemas';
import {
  MHD_ATTENDANCE_CLASSIFICATIONS,
  MHD_OCCURRENCE_TYPES,
  mhdFormatClassification,
  mhdFormatOccurrenceType,
  type MhdAttendanceOccurrence,
  type MhdAttendanceOccurrenceFilters,
} from '../Types';
import { MhdAdjustPointsDialog } from './MhdAdjustPointsDialog';
import { MhdClassificationBadge } from './MhdClassificationBadge';
import { MhdOccurrenceForm } from './MhdOccurrenceForm';
import { MhdOccurrenceTypeBadge } from './MhdOccurrenceTypeBadge';
import { MhdPointLedgerPanel } from './MhdPointLedgerPanel';
import { MhdReassessmentQueuePanel } from './MhdReassessmentQueuePanel';
import { MhdThresholdEventPanel } from './MhdThresholdEventPanel';
import { MhdVoidOccurrenceDialog } from './MhdVoidOccurrenceDialog';

type Tab = 'occurrences' | 'thresholds' | 'reassessments';

/**
 * `/attendance` route entry.
 *
 * Two very different renderings behind one route, decided by the caller's role:
 *
 * - **Privileged** (Platform Admin / HR Partner / Client Admin): the whole
 *   company. Occurrence board, threshold reviews and the reassessment queue.
 * - **Employee** (Client User viewing themselves): their own occurrences and
 *   their own point ledger, and nothing else. The threshold and reassessment
 *   tabs are not merely hidden — the RPCs behind them refuse a non-privileged
 *   caller, because both represent pending decisions about whether to
 *   discipline someone.
 *
 * Viewer never reaches here — the router guard (mhdRouteAccess) excludes it.
 */
export function MhdAttendancePage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPrivileged = mhdCanMutateAttendance(roles);
  const selfPersonId = profile?.personId ?? null;

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading attendance…</p>
      </div>
    );
  }

  return (
    <MhdAttendanceBoard
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

function MhdAttendanceBoard({ companyId, isPrivileged, selfPersonId }: BoardProps) {
  const [tab, setTab] = useState<Tab>('occurrences');
  const [isRecording, setIsRecording] = useState(false);
  const [voidTarget, setVoidTarget] = useState<MhdAttendanceOccurrence | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [filters, setFilters] = useState<MhdAttendanceOccurrenceFilters>({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
    occurrenceType: 'ALL',
    classification: 'ALL',
  });

  const occurrences = useMhdAttendanceOccurrences(filters);
  const policy = useMhdAttendancePolicy(companyId);
  const people = useMhdAttendancePeople(isPrivileged ? companyId : null);
  const thresholdEvents = useMhdThresholdEvents(isPrivileged ? companyId : null);
  const reassessments = useMhdReassessmentEvents(isPrivileged ? companyId : null);

  const recordOccurrence = useMhdRecordOccurrence(companyId);
  const voidOccurrence = useMhdVoidOccurrence(companyId);
  const resolveThreshold = useMhdResolveThresholdEvent(companyId);
  const resolveReassessment = useMhdResolveReassessmentEvent(companyId);
  const adjustPoints = useMhdAdjustPoints(companyId);

  // An employee's own ledger; for a privileged viewer this stays idle until a
  // person is selected in the filter.
  const focusPersonId = isPrivileged ? (filters.personId ?? null) : selfPersonId;
  const balance = useMhdPointBalance(focusPersonId);
  const ledger = useMhdPointLedger(focusPersonId);

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person: { id: string; firstName?: string; lastName?: string }) => ({
        id: person.id,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  const openReassessments = (reassessments.data ?? []).filter((event) => event.status === 'RAISED');
  const openThresholds = (thresholdEvents.data ?? []).filter(
    (event) => event.status === 'RAISED' || event.status === 'ACKNOWLEDGED',
  );

  async function handleRecord(values: MhdOccurrenceFormValues) {
    await recordOccurrence.mutateAsync({
      personId: values.personId,
      occurrenceDate: values.occurrenceDate,
      occurrenceType: values.occurrenceType,
      classification: values.classification,
      protectedLeaveCategory: values.protectedLeaveCategory ?? null,
      minutesVariance: values.minutesVariance ?? null,
      reasonNote: values.reasonNote ?? null,
      scheduledShiftId: values.scheduledShiftId ?? null,
    });
    setIsRecording(false);
  }

  async function handleVoid(reason: string) {
    if (!voidTarget) return;
    await voidOccurrence.mutateAsync({ occurrenceId: voidTarget.id, reason });
    setVoidTarget(null);
  }

  async function handleAdjust(pointsDelta: number, reason: string) {
    if (!focusPersonId) return;
    await adjustPoints.mutateAsync({ personId: focusPersonId, pointsDelta, reason });
    setIsAdjusting(false);
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Attendance</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {isPrivileged
              ? 'Occurrences, points and progressive discipline.'
              : 'Your attendance record and current points.'}
          </p>
        </div>
        {isPrivileged ? (
          <button
            type="button"
            onClick={() => setIsRecording(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
          >
            Record occurrence
          </button>
        ) : null}
      </header>

      {isPrivileged ? (
        <nav className="flex gap-1 border-b border-neutral-200 text-sm">
          {(
            [
              ['occurrences', 'Occurrences'],
              ['thresholds', `Threshold reviews${openThresholds.length ? ` (${openThresholds.length})` : ''}`],
              ['reassessments', `Reassessments${openReassessments.length ? ` (${openReassessments.length})` : ''}`],
            ] as Array<[Tab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`-mb-px border-b-2 px-3 py-2 font-medium ${
                tab === value
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      ) : null}

      {tab === 'occurrences' || !isPrivileged ? (
        <div className="space-y-6">
          {isPrivileged ? (
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.personId ?? ''}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    personId: event.target.value || null,
                  }))
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              >
                <option value="">All employees</option>
                {peopleOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </select>

              <select
                value={filters.occurrenceType ?? 'ALL'}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    occurrenceType: event.target.value as MhdAttendanceOccurrenceFilters['occurrenceType'],
                  }))
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              >
                <option value="ALL">All types</option>
                {MHD_OCCURRENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {mhdFormatOccurrenceType(type)}
                  </option>
                ))}
              </select>

              <select
                value={filters.classification ?? 'ALL'}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    classification: event.target
                      .value as MhdAttendanceOccurrenceFilters['classification'],
                  }))
                }
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              >
                <option value="ALL">All classifications</option>
                {MHD_ATTENDANCE_CLASSIFICATIONS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatClassification(value)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {focusPersonId ? (
            <MhdPointLedgerPanel
              entries={ledger.data ?? []}
              balance={balance.data ?? 0}
              thresholds={policy.data?.thresholds ?? []}
              isLoading={ledger.isLoading || balance.isLoading}
              selfView={!isPrivileged}
            />
          ) : null}

          {/* Adjustment entry point kept deliberately plain; every adjustment
              requires a reason at the RPC, so there is no silent path to points. */}
          {isPrivileged && focusPersonId ? (
            <button
              type="button"
              onClick={() => setIsAdjusting(true)}
              className="text-sm text-neutral-500 underline"
            >
              Adjust points for the selected employee
            </button>
          ) : null}

          <section>
            <h2 className="text-base font-semibold text-neutral-900">Occurrences</h2>
            {occurrences.isLoading ? (
              <p className="mt-2 text-sm text-neutral-500">Loading…</p>
            ) : (occurrences.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No occurrences on record.</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      {isPrivileged ? <th className="py-2 pr-4 font-medium">Employee</th> : null}
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Classification</th>
                      <th className="py-2 pr-4 text-right font-medium">Points</th>
                      {isPrivileged ? <th className="py-2 font-medium" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {(occurrences.data ?? []).map((occurrence) => (
                      <tr
                        key={occurrence.id}
                        className={`border-b border-neutral-100 ${
                          occurrence.voidedAt ? 'text-neutral-400 line-through' : 'text-neutral-800'
                        }`}
                      >
                        <td className="py-2 pr-4 whitespace-nowrap">{occurrence.occurrenceDate}</td>
                        {isPrivileged ? (
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {occurrence.personDisplayName}
                          </td>
                        ) : null}
                        <td className="py-2 pr-4">
                          <MhdOccurrenceTypeBadge occurrenceType={occurrence.occurrenceType} />
                        </td>
                        <td className="py-2 pr-4">
                          {/*
                            showCategory stays off in the roster: the specific
                            protected category can be sensitive (safe-time
                            reasons especially) and does not belong in a list
                            that gets scanned or screen-shared.
                          */}
                          <MhdClassificationBadge classification={occurrence.classification} />
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {occurrence.pointsAssessed}
                        </td>
                        {isPrivileged ? (
                          <td className="py-2 text-right">
                            {!occurrence.voidedAt ? (
                              <button
                                type="button"
                                onClick={() => setVoidTarget(occurrence)}
                                className="text-sm text-neutral-500"
                              >
                                Void
                              </button>
                            ) : null}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {isPrivileged && tab === 'thresholds' ? (
        <MhdThresholdEventPanel
          events={thresholdEvents.data ?? []}
          isLoading={thresholdEvents.isLoading}
          isSubmitting={resolveThreshold.isPending}
          onResolve={(input) => resolveThreshold.mutateAsync(input)}
        />
      ) : null}

      {isPrivileged && tab === 'reassessments' ? (
        <MhdReassessmentQueuePanel
          events={reassessments.data ?? []}
          isLoading={reassessments.isLoading}
          isSubmitting={resolveReassessment.isPending}
          onResolve={async (input) => {
            await resolveReassessment.mutateAsync(input);
          }}
        />
      ) : null}

      {isRecording && isPrivileged ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Record occurrence</h2>
            <MhdOccurrenceForm
              companyId={companyId}
              people={peopleOptions}
              policy={policy.data ?? null}
              onSubmit={handleRecord}
              onCancel={() => setIsRecording(false)}
              isSubmitting={recordOccurrence.isPending}
            />
          </div>
        </div>
      ) : null}

      {isPrivileged && voidTarget ? (
        <MhdVoidOccurrenceDialog
          occurrenceLabel={`${mhdFormatOccurrenceType(voidTarget.occurrenceType)} on ${voidTarget.occurrenceDate}`}
          isSubmitting={voidOccurrence.isPending}
          onSubmit={handleVoid}
          onCancel={() => setVoidTarget(null)}
        />
      ) : null}

      {isPrivileged && isAdjusting && focusPersonId ? (
        <MhdAdjustPointsDialog
          isSubmitting={adjustPoints.isPending}
          onSubmit={handleAdjust}
          onCancel={() => setIsAdjusting(false)}
        />
      ) : null}
    </div>
  );
}
