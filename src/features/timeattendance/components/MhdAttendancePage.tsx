import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRowActionsMenu } from '@/components/ui/MhdRowActionsMenu';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdTabs } from '@/components/ui/MhdTabs';
import { mhdCanMutateConduct } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActionRunner } from '@/utils/useMhdActionRunner';
import {
  useMhdAdjustPoints,
  useMhdAttendanceAccess,
  useMhdAttendanceOccurrences,
  useMhdAttendancePeople,
  useMhdAttendancePolicy,
  useMhdOpenConductCaseFromThreshold,
  useMhdPointBalance,
  useMhdPointLedger,
  useMhdReassessmentEvents,
  useMhdReclassifyOccurrence,
  useMhdRecordOccurrence,
  useMhdResolveReassessmentEvent,
  useMhdResolveThresholdEvent,
  useMhdThresholdEvents,
  useMhdUpdateOccurrence,
  useMhdVoidOccurrence,
  type MhdAttendanceAccess,
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
import { MhdEditOccurrenceDialog } from './MhdEditOccurrenceDialog';
import { MhdOccurrenceForm } from './MhdOccurrenceForm';
import { MhdOccurrenceTypeBadge } from './MhdOccurrenceTypeBadge';
import { MhdPointLedgerPanel } from './MhdPointLedgerPanel';
import { MhdReassessmentQueuePanel } from './MhdReassessmentQueuePanel';
import { MhdReclassifyOccurrenceDialog } from './MhdReclassifyOccurrenceDialog';
import { MhdThresholdEventPanel } from './MhdThresholdEventPanel';
import { MhdVoidOccurrenceDialog } from './MhdVoidOccurrenceDialog';

type Tab = 'occurrences' | 'thresholds' | 'reassessments';

/**
 * `/attendance` route entry.
 *
 * What renders is decided by the caller's read scope (useMhdAttendanceAccess, which
 * mirrors the database predicate):
 *
 * - **Privileged** roles: the whole company with every action - record, edit,
 *   reclassify, void, adjust points, and resolve threshold reviews and reassessments.
 * - **HR Coordinator**: the whole company including the threshold and reassessment
 *   queues, read-only.
 * - **A manager**: their own record and their direct reports', occurrences and point
 *   ledgers only. Protected-leave category and notes come back redacted from the
 *   server, and the discipline queues are not shown - the RPCs refuse them anyway.
 * - **Everyone else**: their own occurrences and ledger, and nothing more.
 *
 * The threshold and reassessment tabs are not merely hidden for callers outside the
 * HR set - the RPCs behind them refuse them, because both represent pending decisions
 * about whether to discipline someone.
 *
 * Viewer never reaches here - the router guard (mhdRouteAccess) excludes it.
 */
export function MhdAttendancePage() {
  const access = useMhdAttendanceAccess();

  if (!access.companyId || access.isScopeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading attendance…</p>
      </div>
    );
  }

  return <MhdAttendanceBoard access={access} companyId={access.companyId} />;
}

interface BoardProps {
  access: MhdAttendanceAccess;
  companyId: string;
}

function MhdAttendanceBoard({ access, companyId }: BoardProps) {
  const { canMutate, canReadAll, scope, selfPersonId, teamMembers } = access;
  const { roles } = useMhdAuth();
  const canOpenConduct = mhdCanMutateConduct(roles);
  const { error, run, clearError } = useMhdActionRunner();

  const [tab, setTab] = useState<Tab>('occurrences');
  const [isRecording, setIsRecording] = useState(false);
  const [voidTarget, setVoidTarget] = useState<MhdAttendanceOccurrence | null>(null);
  const [editTarget, setEditTarget] = useState<MhdAttendanceOccurrence | null>(null);
  const [reclassifyTarget, setReclassifyTarget] = useState<MhdAttendanceOccurrence | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [filters, setFilters] = useState<MhdAttendanceOccurrenceFilters>({
    companyId,
    // Only an own-record-only caller is pinned to a person; company and team readers
    // start on "everyone I can see" and the server returns exactly that set.
    personId: scope === 'self' ? selfPersonId : null,
    occurrenceType: 'ALL',
    classification: 'ALL',
  });

  const occurrences = useMhdAttendanceOccurrences(filters);
  const policy = useMhdAttendancePolicy(companyId);
  const people = useMhdAttendancePeople(scope === 'company' ? companyId : null);
  const thresholdEvents = useMhdThresholdEvents(canReadAll ? companyId : null);
  const reassessments = useMhdReassessmentEvents(canReadAll ? companyId : null);

  const recordOccurrence = useMhdRecordOccurrence(companyId);
  const updateOccurrence = useMhdUpdateOccurrence(companyId);
  const reclassifyOccurrence = useMhdReclassifyOccurrence(companyId);
  const voidOccurrence = useMhdVoidOccurrence(companyId);
  const resolveThreshold = useMhdResolveThresholdEvent(companyId);
  const resolveReassessment = useMhdResolveReassessmentEvent(companyId);
  const adjustPoints = useMhdAdjustPoints(companyId);
  const openConduct = useMhdOpenConductCaseFromThreshold();

  // A ledger is shown for one person at a time: the caller themself when they can see
  // only their own record, otherwise whoever the Employee filter has selected.
  const focusPersonId = scope === 'self' ? selfPersonId : (filters.personId ?? null);
  const balance = useMhdPointBalance(focusPersonId);
  const ledger = useMhdPointLedger(focusPersonId);

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

  const openReassessments = (reassessments.data ?? []).filter((event) => event.status === 'RAISED');
  const openThresholds = (thresholdEvents.data ?? []).filter(
    (event) => event.status === 'RAISED' || event.status === 'ACKNOWLEDGED',
  );

  const showFilters = scope !== 'self';
  const showEmployeeColumn = scope !== 'self';

  async function handleRecord(values: MhdOccurrenceFormValues) {
    const ok = await run(
      () =>
        recordOccurrence.mutateAsync({
          personId: values.personId,
          occurrenceDate: values.occurrenceDate,
          occurrenceType: values.occurrenceType,
          classification: values.classification,
          protectedLeaveCategory: values.protectedLeaveCategory ?? null,
          minutesVariance: values.minutesVariance ?? null,
          reasonNote: values.reasonNote ?? null,
          scheduledShiftId: values.scheduledShiftId ?? null,
        }),
      'Unable to record the occurrence.',
    );
    if (ok) setIsRecording(false);
  }

  async function handleVoid(reason: string) {
    if (!voidTarget) return;
    const ok = await run(
      () => voidOccurrence.mutateAsync({ occurrenceId: voidTarget.id, reason }),
      'Unable to void the occurrence.',
    );
    if (ok) setVoidTarget(null);
  }

  async function handleAdjust(pointsDelta: number, reason: string) {
    if (!focusPersonId) return;
    const ok = await run(
      () => adjustPoints.mutateAsync({ personId: focusPersonId, pointsDelta, reason }),
      'Unable to adjust points.',
    );
    if (ok) setIsAdjusting(false);
  }

  const description = canMutate
    ? 'Occurrences, points and progressive discipline.'
    : scope === 'company'
      ? 'Occurrences, points and discipline queues across the company (read-only).'
      : scope === 'team'
        ? 'Your attendance record and your direct reports’ records.'
        : 'Your attendance record and current points.';

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Attendance"
        description={description}
        actions={
          <div className="flex items-center gap-4">
            <Link
              to="/attendance/policy"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              {canMutate ? 'Attendance Policy' : 'View Attendance Policy'}
            </Link>
            {canMutate ? (
              <Button
                onClick={() => {
                  clearError();
                  setIsRecording(true);
                }}
              >
                Record Occurrence
              </Button>
            ) : null}
          </div>
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

      {canReadAll ? (
        <MhdTabs
          tabs={[
            { value: 'occurrences' as Tab, label: 'Occurrences' },
            {
              value: 'thresholds' as Tab,
              label: 'Threshold Reviews',
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

      {tab === 'occurrences' || !canReadAll ? (
        <div className="space-y-6">
          {showFilters ? (
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
                <option value="">{scope === 'team' ? 'My team' : 'All employees'}</option>
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
              selfView={scope === 'self'}
            />
          ) : null}

          {/* Adjustment entry point kept deliberately plain; every adjustment
              requires a reason at the RPC, so there is no silent path to points. */}
          {canMutate && focusPersonId ? (
            <button
              type="button"
              onClick={() => {
                clearError();
                setIsAdjusting(true);
              }}
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
              <MhdCard className="border border-dashed border-border">
                <MhdEmptyState icon={CalendarClock} title="No occurrences on record." />
              </MhdCard>
            ) : (
              <MhdCard className="overflow-hidden p-0">
                <MhdTable>
                  <thead>
                    <tr>
                      <MhdTh>Date</MhdTh>
                      {showEmployeeColumn ? <MhdTh>Employee</MhdTh> : null}
                      <MhdTh>Type</MhdTh>
                      <MhdTh>Classification</MhdTh>
                      <MhdTh className="text-right">Points</MhdTh>
                      {canMutate ? <MhdTh /> : null}
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
                        {showEmployeeColumn ? (
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
                        {canMutate ? (
                          <MhdTd className="text-right">
                            {!occurrence.voidedAt ? (
                              <MhdRowActionsMenu
                                triggerLabel={`Actions for ${occurrence.referenceId}`}
                                actions={[
                                  {
                                    key: 'edit',
                                    label: 'Edit',
                                    onSelect: () => {
                                      clearError();
                                      setEditTarget(occurrence);
                                    },
                                  },
                                  {
                                    key: 'reclassify',
                                    label: 'Reclassify',
                                    onSelect: () => {
                                      clearError();
                                      setReclassifyTarget(occurrence);
                                    },
                                  },
                                  {
                                    key: 'void',
                                    label: 'Void',
                                    destructive: true,
                                    onSelect: () => {
                                      clearError();
                                      setVoidTarget(occurrence);
                                    },
                                  },
                                ]}
                              />
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

      {canReadAll && tab === 'thresholds' ? (
        <MhdThresholdEventPanel
          events={thresholdEvents.data ?? []}
          isLoading={thresholdEvents.isLoading}
          isSubmitting={resolveThreshold.isPending}
          readOnly={!canMutate}
          onOpenConduct={
            canMutate && canOpenConduct
              ? async (eventId) => {
                  await run(
                    () => openConduct.mutateAsync(eventId),
                    'Unable to open a conduct case.',
                  );
                }
              : undefined
          }
          isOpeningConduct={openConduct.isPending}
          onResolve={async (input) => {
            await run(() => resolveThreshold.mutateAsync(input), 'Unable to save the outcome.');
          }}
        />
      ) : null}

      {canReadAll && tab === 'reassessments' ? (
        <MhdReassessmentQueuePanel
          events={reassessments.data ?? []}
          isLoading={reassessments.isLoading}
          isSubmitting={resolveReassessment.isPending}
          readOnly={!canMutate}
          onResolve={async (input) => {
            await run(
              () => resolveReassessment.mutateAsync(input),
              'Unable to record the decision.',
            );
          }}
        />
      ) : null}

      {isRecording && canMutate ? (
        <MhdModal
          title="Record Occurrence"
          onClose={() => setIsRecording(false)}
          className="relative flex w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-xl"
        >
          <h2 className="mb-4 text-base font-semibold text-foreground">Record Occurrence</h2>
          <MhdOccurrenceForm
            companyId={companyId}
            people={peopleOptions}
            policy={policy.data ?? null}
            onSubmit={handleRecord}
            onCancel={() => setIsRecording(false)}
            isSubmitting={recordOccurrence.isPending}
          />
        </MhdModal>
      ) : null}

      {canMutate && editTarget ? (
        <MhdEditOccurrenceDialog
          occurrence={editTarget}
          isSubmitting={updateOccurrence.isPending}
          onSubmit={async (input) => {
            const ok = await run(
              () => updateOccurrence.mutateAsync(input),
              'Unable to update the occurrence.',
            );
            if (ok) setEditTarget(null);
          }}
          onCancel={() => setEditTarget(null)}
        />
      ) : null}

      {canMutate && reclassifyTarget ? (
        <MhdReclassifyOccurrenceDialog
          occurrence={reclassifyTarget}
          isSubmitting={reclassifyOccurrence.isPending}
          onSubmit={async (input) => {
            const ok = await run(
              () => reclassifyOccurrence.mutateAsync(input),
              'Unable to reclassify the occurrence.',
            );
            if (ok) setReclassifyTarget(null);
          }}
          onCancel={() => setReclassifyTarget(null)}
        />
      ) : null}

      {canMutate && voidTarget ? (
        <MhdVoidOccurrenceDialog
          occurrenceLabel={`${mhdFormatOccurrenceType(voidTarget.occurrenceType)} on ${voidTarget.occurrenceDate}`}
          isSubmitting={voidOccurrence.isPending}
          onSubmit={handleVoid}
          onCancel={() => setVoidTarget(null)}
        />
      ) : null}

      {canMutate && isAdjusting && focusPersonId ? (
        <MhdAdjustPointsDialog
          isSubmitting={adjustPoints.isPending}
          onSubmit={handleAdjust}
          onCancel={() => setIsAdjusting(false)}
        />
      ) : null}
    </div>
  );
}
