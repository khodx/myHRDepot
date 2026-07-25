import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
  useMhdSetLeaveCaseBases,
  useMhdTransitionLeaveCase,
} from '../Hook';
import {
  MHD_LEAVE_CASE_STATUSES,
  mhdFormatLeaveCaseStatus,
  mhdFormatLeaveHours,
  mhdFormatLeaveJurisdiction,
  mhdFormatLeaveLedgerEntryType,
  type MhdLeaveBalanceRow,
  type MhdLeaveCaseStatus,
} from '../Types';
import { MhdLeaveBalancePanel } from './MhdLeaveBalancePanel';
import { MhdLeaveCertificationPanel } from './MhdLeaveCertificationPanel';
import { MhdLeaveStatusBadge } from './MhdLeaveStatusBadge';
import { MhdLeaveWorkflowPanel } from './MhdLeaveWorkflowPanel';

const REQUIRE_REASON: readonly MhdLeaveCaseStatus[] = ['DENIED', 'CANCELLED'];

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

  const leaveTypes = useMhdLeaveTypes(companyId || null);
  const caseBases = useMhdLeaveCaseBases(caseId);
  const ledger = useMhdLeaveLedger(personId);
  const certifications = useMhdLeaveCertifications(caseId);

  const designatedIds = useMemo(() => caseBases.data ?? [], [caseBases.data]);
  const balanceQueries = useMhdLeaveBalances(personId, designatedIds);

  const setBases = useMhdSetLeaveCaseBases();
  const designate = useMhdDesignateLeave();
  const adjust = useMhdAdjustLeave();
  const transition = useMhdTransitionLeaveCase();
  const recordCert = useMhdRecordCertification();
  const markCert = useMhdMarkCertificationSufficient(caseId);

  // ----- Designation-set editor state -----
  // The editor seeds from the persisted set at the moment the user opens it (in
  // toggleEditingBases), not via an effect — so a background refetch of the bases
  // never clobbers an in-progress edit, and there is no setState-in-effect.
  const [isEditingBases, setIsEditingBases] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleEditingBases() {
    setIsEditingBases((editing) => {
      if (!editing) setSelectedIds(designatedIds);
      return !editing;
    });
  }

  // ----- Designate-hours form state -----
  const [designateHours, setDesignateHours] = useState('');
  const [designateDate, setDesignateDate] = useState(new Date().toISOString().slice(0, 10));
  const [designateError, setDesignateError] = useState<string | null>(null);

  // ----- Transition form state -----
  const [newStatus, setNewStatus] = useState<MhdLeaveCaseStatus>('APPROVED');
  const [decisionReason, setDecisionReason] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // ----- Adjustment form state -----
  const [adjustTypeId, setAdjustTypeId] = useState('');
  const [adjustHours, setAdjustHours] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

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

  function toggleSelected(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }

  async function saveBases() {
    await setBases.mutateAsync({ caseId, leaveTypeIds: selectedIds });
    setIsEditingBases(false);
  }

  async function submitDesignate() {
    const hours = Number.parseFloat(designateHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      setDesignateError('Designated hours must be positive.');
      return;
    }
    setDesignateError(null);
    await designate.mutateAsync({ caseId, hours, effectiveDate: designateDate });
    setDesignateHours('');
  }

  async function submitTransition() {
    if (REQUIRE_REASON.includes(newStatus) && !decisionReason.trim()) {
      setTransitionError('Denying or cancelling a leave requires a recorded reason.');
      return;
    }
    setTransitionError(null);
    await transition.mutateAsync({
      caseId,
      newStatus,
      decisionReason: decisionReason.trim() || null,
    });
    setDecisionReason('');
  }

  async function submitAdjust() {
    const hours = Number.parseFloat(adjustHours);
    if (!adjustTypeId) {
      setAdjustError('Choose a legal basis to adjust.');
      return;
    }
    if (!Number.isFinite(hours) || hours === 0) {
      setAdjustError('Enter a non-zero number of hours.');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('A manual adjustment requires a reason.');
      return;
    }
    if (!personId) return;
    setAdjustError(null);
    await adjust.mutateAsync({
      personId,
      leaveTypeId: adjustTypeId,
      hoursDelta: hours,
      reason: adjustReason.trim(),
    });
    setAdjustHours('');
    setAdjustReason('');
  }

  if (cases.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!leaveCase) return <p className="text-sm text-muted-foreground">Leave case not found.</p>;

  return (
    <div className="space-y-6">
      {/* ----- Case facts ----- */}
      <MhdPageHeader
        backTo="/leaves"
        backLabel="all leaves"
        title={leaveCase.personDisplayName}
        chips={<MhdLeaveStatusBadge status={leaveCase.status} />}
        description={
          <>
            <span className="font-mono">{leaveCase.referenceId}</span> · {leaveCase.reasonCategory}
            {leaveCase.requestedStart ? ` · ${leaveCase.requestedStart}` : ''}
            {leaveCase.requestedEnd ? ` → ${leaveCase.requestedEnd}` : ''}
          </>
        }
      />

      {/* ----- Status transition (privileged) ----- */}
      {isPrivileged ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Status" className="mb-0" />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="newStatus" className="block text-sm font-medium text-foreground">
                Move to
              </label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value as MhdLeaveCaseStatus)}
                className={`mt-1 ${INPUT_CLASSES}`}
              >
                {MHD_LEAVE_CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {mhdFormatLeaveCaseStatus(status)}
                  </option>
                ))}
              </select>
            </div>
            {REQUIRE_REASON.includes(newStatus) ? (
              <div className="flex-1">
                <label
                  htmlFor="decisionReason"
                  className="block text-sm font-medium text-foreground"
                >
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
            <Button disabled={transition.isPending} onClick={() => void submitTransition()}>
              {transition.isPending ? 'Saving…' : 'Update status'}
            </Button>
          </div>
          {transitionError ? <p className="text-xs text-rose-600">{transitionError}</p> : null}
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
            <Button variant="secondary" onClick={toggleEditingBases}>
              {isEditingBases ? 'Cancel' : 'Edit bases'}
            </Button>
          ) : null}
        </div>

        {isEditingBases && isPrivileged ? (
          <MhdCard className="space-y-3">
            <ul className="space-y-1">
              {(leaveTypes.data ?? []).map((type) => (
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
            <div className="flex justify-end">
              <Button disabled={setBases.isPending} onClick={() => void saveBases()}>
                {setBases.isPending ? 'Saving…' : 'Save bases'}
              </Button>
            </div>
          </MhdCard>
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
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="designateHours" className="block text-sm font-medium text-foreground">
                Hours
              </label>
              <input
                id="designateHours"
                type="number"
                min={0}
                value={designateHours}
                onChange={(event) => setDesignateHours(event.target.value)}
                className={`mt-1 w-32 ${INPUT_CLASSES}`}
              />
            </div>
            <div>
              <label htmlFor="designateDate" className="block text-sm font-medium text-foreground">
                Effective date
              </label>
              <input
                id="designateDate"
                type="date"
                value={designateDate}
                onChange={(event) => setDesignateDate(event.target.value)}
                className={`mt-1 ${INPUT_CLASSES}`}
              />
            </div>
            <Button
              // Disabled with no bases: the RPC refuses to decrement a case that
              // has no designated bases, so there is nothing to designate against.
              disabled={designate.isPending || designatedIds.length === 0}
              onClick={() => void submitDesignate()}
            >
              {designate.isPending ? 'Recording…' : 'Designate'}
            </Button>
          </div>
          {designatedIds.length === 0 ? (
            <p className="text-xs text-amber-700">
              Designate at least one legal basis above before recording hours.
            </p>
          ) : null}
          {designateError ? <p className="text-xs text-rose-600">{designateError}</p> : null}
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
        {isPrivileged ? (
          <MhdCard className="mt-3 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Adjust a basis</h3>
            <div className="flex flex-wrap items-end gap-3">
              <select
                value={adjustTypeId}
                onChange={(event) => setAdjustTypeId(event.target.value)}
                className={INPUT_CLASSES}
              >
                <option value="">Legal basis…</option>
                {(leaveTypes.data ?? []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.typeName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={adjustHours}
                placeholder="± hours"
                onChange={(event) => setAdjustHours(event.target.value)}
                className={`w-28 ${INPUT_CLASSES}`}
              />
              <input
                type="text"
                value={adjustReason}
                placeholder="Reason (required)"
                onChange={(event) => setAdjustReason(event.target.value)}
                className={`flex-1 ${INPUT_CLASSES}`}
              />
              <Button
                variant="secondary"
                disabled={adjust.isPending}
                onClick={() => void submitAdjust()}
              >
                {adjust.isPending ? 'Saving…' : 'Adjust'}
              </Button>
            </div>
            {adjustError ? <p className="text-xs text-rose-600">{adjustError}</p> : null}
          </MhdCard>
        ) : null}
      </section>

      {/* ----- Certification partition ----- */}
      <MhdLeaveCertificationPanel
        caseId={caseId}
        certifications={certifications.data ?? []}
        canSeeMedical={canSeeMedical}
        isLoading={certifications.isLoading}
        isSubmitting={recordCert.isPending || markCert.isPending}
        onRecord={async (input) => {
          await recordCert.mutateAsync(input);
        }}
        onMarkSufficient={async (input) => {
          await markCert.mutateAsync(input);
        }}
      />
    </div>
  );
}
