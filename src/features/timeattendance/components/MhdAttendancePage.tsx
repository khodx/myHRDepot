import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
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
        <p className="text-sm text-muted-foreground">Loading attendance…</p>
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
    <div className="space-y-6">
      <MhdPageHeader
        title="Attendance"
        description={
          isPrivileged
            ? 'Occurrences, points and progressive discipline.'
            : 'Your attendance record and current points.'
        }
        actions={
          isPrivileged ? (
            <Button onClick={() => setIsRecording(true)}>Record occurrence</Button>
          ) : undefined
        }
      />

      {isPrivileged ? (
        <MhdTabs
          tabs={[
            { value: 'occurrences' as Tab, label: 'Occurrences' },
            {
              value: 'thresholds' as Tab,
              label: 'Threshold reviews',
              count: openThresholds.length || undefined,
            },
            {
              value: 'reassessments' as Tab,
              label: 'Reassessments',
              count: openReassessments.length || undefined,
            },
          ]}
          value={tab}
          onChange={setTab}
        />
      ) : null}

      {tab === 'occurrences' || !isPrivileged ? (
        <div className="space-y-6">
          {isPrivileged ? (
            <MhdCard className="grid gap-3 md:grid-cols-3">
              <MhdFilterSelect
                label="Employee"
                value={filters.personId ?? ''}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    personId: event.target.value || null,
                  }))
                }
              >
                <option value="">All employees</option>
                {peopleOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </MhdFilterSelect>

              <MhdFilterSelect
                label="Type"
                value={filters.occurrenceType ?? 'ALL'}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    occurrenceType: event.target
                      .value as MhdAttendanceOccurrenceFilters['occurrenceType'],
                  }))
                }
              >
                <option value="ALL">All types</option>
                {MHD_OCCURRENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {mhdFormatOccurrenceType(type)}
                  </option>
                ))}
              </MhdFilterSelect>

              <MhdFilterSelect
                label="Classification"
                value={filters.classification ?? 'ALL'}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    classification: event.target
                      .value as MhdAttendanceOccurrenceFilters['classification'],
                  }))
                }
              >
                <option value="ALL">All classifications</option>
                {MHD_ATTENDANCE_CLASSIFICATIONS.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatClassification(value)}
                  </option>
                ))}
              </MhdFilterSelect>
            </MhdCard>
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
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              Adjust points for the selected employee
            </button>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Occurrences</h2>
            {occurrences.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (occurrences.data ?? []).length === 0 ? (
              <MhdCard className="border-dashed">
                <MhdEmptyState icon={CalendarClock} title="No occurrences on record." />
              </MhdCard>
            ) : (
              <MhdCard className="overflow-hidden p-0">
                <MhdTable>
                  <thead>
                    <tr>
                      <MhdTh>Date</MhdTh>
                      {isPrivileged ? <MhdTh>Employee</MhdTh> : null}
                      <MhdTh>Type</MhdTh>
                      <MhdTh>Classification</MhdTh>
                      <MhdTh className="text-right">Points</MhdTh>
                      {isPrivileged ? <MhdTh /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {(occurrences.data ?? []).map((occurrence) => (
                      <MhdTr
                        key={occurrence.id}
                        className={
                          occurrence.voidedAt ? 'text-muted-foreground line-through' : undefined
                        }
                      >
                        <MhdTd className="whitespace-nowrap">{occurrence.occurrenceDate}</MhdTd>
                        {isPrivileged ? (
                          <MhdTd className="whitespace-nowrap">
                            {occurrence.personDisplayName}
                          </MhdTd>
                        ) : null}
                        <MhdTd>
                          <MhdOccurrenceTypeBadge occurrenceType={occurrence.occurrenceType} />
                        </MhdTd>
                        <MhdTd>
                          {/*
                            showCategory stays off in the roster: the specific
                            protected category can be sensitive (safe-time
                            reasons especially) and does not belong in a list
                            that gets scanned or screen-shared.
                          */}
                          <MhdClassificationBadge classification={occurrence.classification} />
                        </MhdTd>
                        <MhdTd className="text-right tabular-nums">
                          {occurrence.pointsAssessed}
                        </MhdTd>
                        {isPrivileged ? (
                          <MhdTd className="text-right">
                            {!occurrence.voidedAt ? (
                              <button
                                type="button"
                                onClick={() => setVoidTarget(occurrence)}
                                className="text-sm font-medium text-accent hover:text-accent-hover"
                              >
                                Void
                              </button>
                            ) : null}
                          </MhdTd>
                        ) : null}
                      </MhdTr>
                    ))}
                  </tbody>
                </MhdTable>
              </MhdCard>
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
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Record occurrence</h2>
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
