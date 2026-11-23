import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdLeaveCaseRecordTabs } from '@/appshell/components/MhdLeaveCaseRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdLeavesCanSeeMedical, mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import {
  useMhdAdjustLeave,
  useMhdDesignateLeave,
  useMhdLeaveBalances,
  useMhdLeaveCaseBases,
  useMhdLeaveCases,
  useMhdLeaveCertifications,
  useMhdLeaveLedger,
  useMhdLeaveTypes,
  useMhdRecordCertification,
  useMhdMarkCertificationSufficient,
  useMhdUpdateCertificationStatus,
  useMhdSetLeaveCaseBases,
  useMhdTransitionLeaveCase,
} from '../Hook';
import {
  MHD_LEAVE_STATUS_TRANSITIONS,
  mhdFormatLeaveCaseStatus,
  mhdFormatLeaveHours,
  mhdFormatLeaveJurisdiction,
  mhdFormatLeaveLedgerEntryType,
  type MhdAdjustLeaveInput,
  type MhdDesignateLeaveInput,
  type MhdLeaveBalanceRow,
  type MhdLeaveCaseStatus,
  type MhdLeaveType,
  type MhdTransitionLeaveCaseInput,
} from '../Types';
import { MhdLeaveActionButtons, MhdLeaveActionModal } from './MhdLeaveActionModal';
import { MhdLeaveBalancePanel } from './MhdLeaveBalancePanel';
import { MhdLeaveCertificationPanel } from './MhdLeaveCertificationPanel';
import { MhdLeaveStatusBadge } from './MhdLeaveStatusBadge';
import { useMhdLeaveCertificationClearDates, useMhdLeaveWorkflow } from '../WorkflowHook';
import type { MhdLeavePolicy } from '../WorkflowTypes';
import { mhdEmployeeFileLabelForKey } from '@/features/employee-files/Types';
import { MhdLeaveWorkflowPanel } from './MhdLeaveWorkflowPanel';
import { useMhdLeaveDraftField } from './mhdLeaveActionContext';
import { mhdLeaveEnumLabel } from './mhdLeaveLabels';

const REQUIRE_REASON: readonly MhdLeaveCaseStatus[] = ['DENIED', 'CANCELLED'];

/**
 * The company's 12-month leave-year method (`method_text_key` from mhd_leave_policy_get).
 * Without a recorded election the method most favorable to the employee applies.
 */
function leaveYearText(policy: MhdLeavePolicy): string {
  if (!policy.election_recorded || !policy.year_method)
    return 'Leave Year: Most Favorable To The Employee';
  return `Leave Year: ${mhdLeaveEnumLabel(policy.year_method)}`;
}

const INPUT_CLASSES =
  'rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * `/leaves/:caseId` (route entry).
 *
 * Reads `useMhdAuth()` and `useParams()` itself, per the app convention.
 * `canSeeMedical` is derived from the ROUTE via `mhdLeavesCanSeeMedical(roles)`
 * (Platform Admin + HR Partner ONLY) — narrower than general leave
 * administration, so a Client Admin is privileged but still cannot see medical
 * detail. The certification RPC masks the note/document server-side; this flag
 * only lets the panel word the null honestly.
 *
 * The case's facts, its designated legal-basis set, the per-basis balance panel,
 * the append-only ledger and the certification partition. There is no dedicated
 * "get case" RPC in v1, so the case facts are resolved from the (cached) case
 * list; the designated bases come from the `mhd_leave_case_get_bases` contract.
 * Status changes, the basis set, designation and adjustments each open in an
 * MhdLeaveActionModal with a saved draft.
 */
export function MhdLeaveCaseDetailPage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isPrivileged = mhdLeavesIsPrivileged(roles);
  const canSeeMedical = mhdLeavesCanSeeMedical(roles);
  const selfPersonId = profile?.personId ?? null;

  const cases = useMhdLeaveCases({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
  });
  const leaveCase = (cases.data ?? []).find((candidate) => candidate.id === caseId) ?? null;
  const personId = leaveCase?.personId ?? null;
  const nextStatuses = leaveCase ? MHD_LEAVE_STATUS_TRANSITIONS[leaveCase.status] : [];

  const leaveTypes = useMhdLeaveTypes(companyId || null);
  const caseBases = useMhdLeaveCaseBases(caseId);
  const ledger = useMhdLeaveLedger(personId);
  const certifications = useMhdLeaveCertifications(caseId);
  // Same query key as the workflow panel, so this shares its cache entry rather than fetching twice.
  const workflow = useMhdLeaveWorkflow(caseId);
  // The case's own company scopes its drafts; the viewer's company stands in until it loads.
  const caseCompanyId = workflow.data?.case.company_id ?? (companyId || null);

  const designatedIds = useMemo(() => caseBases.data ?? [], [caseBases.data]);
  const balanceQueries = useMhdLeaveBalances(personId, designatedIds);

  const setBases = useMhdSetLeaveCaseBases();
  const designate = useMhdDesignateLeave();
  const adjust = useMhdAdjustLeave();
  const transition = useMhdTransitionLeaveCase();
  const recordCert = useMhdRecordCertification();
  const markCert = useMhdMarkCertificationSufficient(caseId);
  const updateCertStatus = useMhdUpdateCertificationStatus(caseId);
  const clearCertDates = useMhdLeaveCertificationClearDates(caseId);
  const overdueDeadlines = (workflow.data?.deadlines ?? []).filter(
    (deadline) => deadline.is_overdue,
  ).length;

  // The basis editor and the status modal are each launched from more than one place, so
  // their open state lives here. The status modal can open preset to CANCELLED (Cancel Case).
  const [isEditingBases, setIsEditingBases] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [presetStatus, setPresetStatus] = useState<MhdLeaveCaseStatus | null>(null);

  // Map the designated bases to full type records + their (parallel) balances.
  // Aligned by index because useMhdLeaveBalances iterates designatedIds in order.
  const balanceRows = useMemo<MhdLeaveBalanceRow[]>(() => {
    const byId = new Map((leaveTypes.data ?? []).map((type) => [type.id, type]));
    return designatedIds
      .map((id, index) => {
        const leaveType = byId.get(id);
        if (!leaveType) return null;
        return { leaveType, remainingHours: balanceQueries[index]?.data ?? 0 };
      })
      .filter((row): row is MhdLeaveBalanceRow => row !== null);
  }, [designatedIds, leaveTypes.data, balanceQueries]);

  const balancesLoading =
    caseBases.isLoading || leaveTypes.isLoading || balanceQueries.some((query) => query.isLoading);

  function openStatus(preset: MhdLeaveCaseStatus | null) {
    setPresetStatus(preset);
    setStatusOpen(true);
  }

  // Opens the status modal preset to CANCELLED rather than performing any delete — the
  // modal already requires a typed reason before it will submit (see REQUIRE_REASON).
  function openCancelFlow() {
    openStatus('CANCELLED');
  }

  if (cases.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!leaveCase) return <p className="text-sm text-muted-foreground">Leave case not found.</p>;

  const modalScope = { caseId, companyId: caseCompanyId };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to={`/leaves/${caseId}/intake`}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium"
        >
          Guided evaluation
        </Link>
      </div>
      {/* ----- Case facts ----- */}
      <MhdPageHeader
        backTo="/leaves"
        backLabel="all leaves"
        title={leaveCase.personDisplayName}
        chips={
          <>
            <MhdLeaveStatusBadge status={leaveCase.status} />
            {overdueDeadlines > 0 ? (
              <MhdBadge variant="error">
                {overdueDeadlines} Overdue {overdueDeadlines === 1 ? 'Deadline' : 'Deadlines'}
              </MhdBadge>
            ) : null}
          </>
        }
        description={
          <>
            <span className="font-mono">{leaveCase.referenceId}</span> · {leaveCase.reasonCategory} ·{' '}
            {mhdEmployeeFileLabelForKey(leaveCase.fileCategory)}
            {leaveCase.requestedStart ? ` · ${leaveCase.requestedStart}` : ''}
            {leaveCase.requestedEnd ? ` → ${leaveCase.requestedEnd}` : ''}
            {workflow.data ? ` · ${leaveYearText(workflow.data.policy)}` : ''}
          </>
        }
        actions={
          isPrivileged ? (
            <Button variant="warning" onClick={() => setIsEditingBases(true)}>
              Edit Bases
            </Button>
          ) : undefined
        }
      />

      <MhdLeaveCaseRecordTabs
        caseId={leaveCase.id}
        active="detail"
        onDelete={isPrivileged && nextStatuses.includes('CANCELLED') ? openCancelFlow : undefined}
        deleteLabel="Cancel Case"
        skipConfirm
      />

      {/* ----- Status transition (privileged) ----- */}
      {isPrivileged ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Status" className="mb-0" />
          {nextStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This case is {mhdFormatLeaveCaseStatus(leaveCase.status).toLowerCase()}; no further
              status changes are available.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Currently {mhdFormatLeaveCaseStatus(leaveCase.status)}.
              </p>
              <Button variant="secondary" onClick={() => openStatus(null)}>
                Change Status
              </Button>
            </div>
          )}
          <MhdLeaveActionModal
            {...modalScope}
            action="status"
            title="Change Leave Status"
            size="md"
            open={statusOpen && nextStatuses.length > 0}
            onOpenChange={setStatusOpen}
          >
            <StatusTransitionForm
              caseId={caseId}
              nextStatuses={nextStatuses}
              presetStatus={presetStatus}
              isPending={transition.isPending}
              onSubmit={(input) => transition.mutateAsync(input)}
            />
          </MhdLeaveActionModal>
        </MhdCard>
      ) : null}

      {/* ----- Designation set (where concurrency lives) ----- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Designated legal bases</h2>
            {/*
              THE concurrency control. A leave interval can be covered by several
              laws at once (FMLA + PDL concurrent, CFRA sequential); each is a
              separate clock. In v1 the administrator picks the set explicitly —
              the auto-qualification engine that would derive it is v2 — and a
              single "designate hours" call then decrements EVERY basis in this
              set at once. The set is the human's legal judgement, made once and
              recorded, before any hours move.
            */}
            <p className="mt-0.5 text-xs text-muted-foreground">
              The laws this leave counts against. Each is decremented independently when hours are
              designated.
            </p>
          </div>
          {isPrivileged ? (
            <Button variant="secondary" onClick={() => setIsEditingBases(true)}>
              Edit Bases
            </Button>
          ) : null}
        </div>

        {isPrivileged ? (
          <MhdLeaveActionModal
            {...modalScope}
            action="bases"
            title="Edit Designated Legal Bases"
            open={isEditingBases}
            onOpenChange={setIsEditingBases}
          >
            {/* Seeds from the persisted set when the modal opens, so a background refetch
                of the bases never clobbers an in-progress edit. */}
            <BasesForm
              caseId={caseId}
              leaveTypes={leaveTypes.data ?? []}
              designatedIds={designatedIds}
              isPending={setBases.isPending}
              onSubmit={(input) => setBases.mutateAsync(input)}
            />
          </MhdLeaveActionModal>
        ) : null}
      </section>

      {/* ----- Per-basis balances (the point of the module) ----- */}
      <MhdCard>
        <MhdLeaveBalancePanel rows={balanceRows} isLoading={balancesLoading} />
      </MhdCard>

      <MhdLeaveWorkflowPanel caseId={caseId} privileged={isPrivileged} />

      {/* ----- Designate hours ----- */}
      {isPrivileged ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Designate hours" className="mb-0" />
          <p className="text-xs text-muted-foreground">
            Records hours taken against the whole basis set at once — one ledger row per basis. This
            is the manual v1 decrement.
          </p>
          <MhdLeaveActionModal
            {...modalScope}
            action="designate-hours"
            title="Designate Hours"
            size="md"
            launchLabel="Designate Hours"
            launchVariant="primary"
            // Disabled with no bases: the RPC refuses to decrement a case that
            // has no designated bases, so there is nothing to designate against.
            launchDisabled={designatedIds.length === 0}
          >
            <DesignateHoursForm
              caseId={caseId}
              isPending={designate.isPending}
              onSubmit={(input) => designate.mutateAsync(input)}
            />
          </MhdLeaveActionModal>
          {designatedIds.length === 0 ? (
            <p className="text-xs text-amber-700">
              Designate at least one legal basis above before recording hours.
            </p>
          ) : null}
        </MhdCard>
      ) : null}

      {/* ----- Ledger (append-only, per basis) ----- */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Ledger</h2>
        {ledger.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading ledger…</p>
        ) : (ledger.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No ledger activity for this person yet.</p>
        ) : (
          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Effective</MhdTh>
                  <MhdTh>Basis</MhdTh>
                  <MhdTh>Entry</MhdTh>
                  <MhdTh className="text-right">Hours</MhdTh>
                  <MhdTh>Reason</MhdTh>
                </tr>
              </thead>
              <tbody>
                {(ledger.data ?? []).map((entry) => (
                  <MhdTr key={entry.id}>
                    <MhdTd className="whitespace-nowrap">{entry.effectiveDate}</MhdTd>
                    <MhdTd className="whitespace-nowrap">{entry.typeName}</MhdTd>
                    <MhdTd className="whitespace-nowrap">
                      {mhdFormatLeaveLedgerEntryType(entry.entryType)}
                    </MhdTd>
                    <MhdTd
                      className={`text-right tabular-nums ${
                        entry.hoursDelta < 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {entry.hoursDelta > 0 ? `+${entry.hoursDelta}` : entry.hoursDelta}
                    </MhdTd>
                    <MhdTd>
                      {entry.reason ?? <span className="text-muted-foreground">—</span>}
                    </MhdTd>
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
          </MhdCard>
        )}
        <p className="text-xs text-muted-foreground">
          Append-only: corrections appear as reversing or adjustment entries rather than edits, so
          the history stays intact for FMLA recordkeeping.
        </p>

        {/* Manual adjustment — every adjustment requires a reason at the RPC. */}
        {isPrivileged && personId ? (
          <div className="mt-3 flex justify-end">
            <MhdLeaveActionModal
              {...modalScope}
              action="adjust"
              title="Adjust A Basis"
              size="md"
              launchLabel="Adjust A Basis"
            >
              <AdjustBasisForm
                personId={personId}
                leaveTypes={leaveTypes.data ?? []}
                isPending={adjust.isPending}
                onSubmit={(input) => adjust.mutateAsync(input)}
              />
            </MhdLeaveActionModal>
          </div>
        ) : null}
      </section>

      {/* ----- Certification partition ----- */}
      <MhdLeaveCertificationPanel
        caseId={caseId}
        companyId={caseCompanyId}
        certifications={certifications.data ?? []}
        workflowCertifications={workflow.data?.certifications}
        canSeeMedical={canSeeMedical}
        isLoading={certifications.isLoading}
        isSubmitting={
          recordCert.isPending ||
          markCert.isPending ||
          updateCertStatus.isPending ||
          clearCertDates.isPending
        }
        onRecord={async (input) => {
          await recordCert.mutateAsync(input);
        }}
        onMarkSufficient={async (input) => {
          await markCert.mutateAsync(input);
        }}
        onUpdateStatus={async (input) => {
          await updateCertStatus.mutateAsync(input);
        }}
        onClearDates={async (input) => {
          await clearCertDates.mutateAsync(input);
        }}
      />

      {isPrivileged ? (
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="warning" onClick={() => setIsEditingBases(true)}>
            Edit Bases
          </Button>
          <MhdDetailActions onDelete={openCancelFlow} deleteLabel="Cancel Case" skipConfirm />
        </div>
      ) : null}
    </div>
  );
}

function StatusTransitionForm({
  caseId,
  nextStatuses,
  presetStatus,
  isPending,
  onSubmit,
}: {
  caseId: string;
  nextStatuses: readonly MhdLeaveCaseStatus[];
  presetStatus: MhdLeaveCaseStatus | null;
  isPending: boolean;
  onSubmit: (input: MhdTransitionLeaveCaseInput) => Promise<unknown>;
}) {
  const [newStatus, setNewStatus] = useMhdLeaveDraftField<MhdLeaveCaseStatus>(
    'newStatus',
    presetStatus ?? 'APPROVED',
  );
  const [decisionReason, setDecisionReason] = useMhdLeaveDraftField('decisionReason', '');
  // The chosen status only counts while it is still a legal next state for this case.
  const effectiveNewStatus: MhdLeaveCaseStatus | null = nextStatuses.includes(newStatus)
    ? newStatus
    : (nextStatuses[0] ?? null);
  if (effectiveNewStatus === null) return null;
  const reasonRequired = REQUIRE_REASON.includes(effectiveNewStatus);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="newStatus" className="block text-sm font-medium text-foreground">
          Move to
        </label>
        <select
          id="newStatus"
          value={effectiveNewStatus}
          onChange={(event) => setNewStatus(event.target.value as MhdLeaveCaseStatus)}
          className={`mt-1 ${INPUT_CLASSES}`}
        >
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {mhdFormatLeaveCaseStatus(status)}
            </option>
          ))}
        </select>
      </div>
      {reasonRequired ? (
        <div>
          <label htmlFor="decisionReason" className="block text-sm font-medium text-foreground">
            Reason <span className="font-normal text-muted-foreground">(required)</span>
          </label>
          <input
            id="decisionReason"
            type="text"
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.target.value)}
            className={`mt-1 w-full ${INPUT_CLASSES}`}
          />
        </div>
      ) : null}
      <MhdLeaveActionButtons
        submitLabel="Update Status"
        disabled={isPending}
        onSubmit={async () => {
          if (reasonRequired && !decisionReason.trim()) {
            throw new Error('Denying or cancelling a leave requires a recorded reason.');
          }
          await onSubmit({
            caseId,
            newStatus: effectiveNewStatus,
            decisionReason: decisionReason.trim() || null,
          });
        }}
      />
    </div>
  );
}

function BasesForm({
  caseId,
  leaveTypes,
  designatedIds,
  isPending,
  onSubmit,
}: {
  caseId: string;
  leaveTypes: MhdLeaveType[];
  designatedIds: string[];
  isPending: boolean;
  onSubmit: (input: { caseId: string; leaveTypeIds: string[] }) => Promise<unknown>;
}) {
  const [selectedIds, setSelectedIds] = useMhdLeaveDraftField('leaveTypeIds', designatedIds);

  function toggleSelected(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1">
        {leaveTypes.map((type) => (
          <li key={type.id}>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selectedIds.includes(type.id)}
                onChange={() => toggleSelected(type.id)}
                className="rounded border-border"
              />
              <span className="font-medium">{type.typeName}</span>
              <span className="text-xs text-muted-foreground">
                {mhdFormatLeaveJurisdiction(type.jurisdiction)} ·{' '}
                {mhdFormatLeaveHours(type.entitlementHours)}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <MhdLeaveActionButtons
        submitLabel="Save Bases"
        disabled={isPending}
        onSubmit={() => onSubmit({ caseId, leaveTypeIds: selectedIds })}
      />
    </div>
  );
}

function DesignateHoursForm({
  caseId,
  isPending,
  onSubmit,
}: {
  caseId: string;
  isPending: boolean;
  onSubmit: (input: MhdDesignateLeaveInput) => Promise<unknown>;
}) {
  const [hours, setHours] = useMhdLeaveDraftField('hours', '');
  const [effectiveDate, setEffectiveDate] = useMhdLeaveDraftField(
    'effectiveDate',
    new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="designateHours" className="block text-sm font-medium text-foreground">
            Hours
          </label>
          <input
            id="designateHours"
            type="number"
            min={0}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className={`mt-1 w-32 ${INPUT_CLASSES}`}
          />
        </div>
        <div>
          <label htmlFor="designateDate" className="block text-sm font-medium text-foreground">
            Effective date
          </label>
          <MhdDateField
            id="designateDate"
            value={effectiveDate}
            onChange={(nextValue) => setEffectiveDate(nextValue)}
            className={`mt-1 ${INPUT_CLASSES}`}
          />
        </div>
      </div>
      <MhdLeaveActionButtons
        submitLabel="Designate"
        pendingLabel="Recording…"
        disabled={isPending}
        onSubmit={async () => {
          const parsed = Number.parseFloat(hours);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new Error('Designated hours must be positive.');
          }
          await onSubmit({ caseId, hours: parsed, effectiveDate });
        }}
      />
    </div>
  );
}

function AdjustBasisForm({
  personId,
  leaveTypes,
  isPending,
  onSubmit,
}: {
  personId: string;
  leaveTypes: MhdLeaveType[];
  isPending: boolean;
  onSubmit: (input: MhdAdjustLeaveInput) => Promise<unknown>;
}) {
  const [typeId, setTypeId] = useMhdLeaveDraftField('leaveTypeId', '');
  const [hours, setHours] = useMhdLeaveDraftField('hoursDelta', '');
  const [reason, setReason] = useMhdLeaveDraftField('reason', '');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Legal basis
        <select
          value={typeId}
          onChange={(event) => setTypeId(event.target.value)}
          className={`mt-1 w-full ${INPUT_CLASSES}`}
        >
          <option value="">Legal basis…</option>
          {leaveTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.typeName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-foreground">
        Hours
        <input
          type="number"
          value={hours}
          placeholder="± hours"
          onChange={(event) => setHours(event.target.value)}
          className={`mt-1 w-full ${INPUT_CLASSES}`}
        />
      </label>
      <label className="block text-sm font-medium text-foreground">
        Reason
        <input
          type="text"
          value={reason}
          placeholder="Reason (required)"
          onChange={(event) => setReason(event.target.value)}
          className={`mt-1 w-full ${INPUT_CLASSES}`}
        />
      </label>
      <MhdLeaveActionButtons
        submitLabel="Adjust"
        disabled={isPending}
        onSubmit={async () => {
          const parsed = Number.parseFloat(hours);
          if (!typeId) throw new Error('Choose a legal basis to adjust.');
          if (!Number.isFinite(parsed) || parsed === 0) {
            throw new Error('Enter a non-zero number of hours.');
          }
          if (!reason.trim()) throw new Error('A manual adjustment requires a reason.');
          await onSubmit({
            personId,
            leaveTypeId: typeId,
            hoursDelta: parsed,
            reason: reason.trim(),
          });
        }}
      />
    </div>
  );
}
