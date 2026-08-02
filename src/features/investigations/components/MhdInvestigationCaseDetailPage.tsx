import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdInvestigationCaseRecordTabs } from '@/appshell/components/MhdInvestigationCaseRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAddInvestigationParty,
  useMhdAssignInvestigator,
  useMhdGrantInvestigationAccess,
  useMhdInvestigationCase,
  useMhdInvestigationGrants,
  useMhdInvestigationParties,
  useMhdInvestigationPeople,
  useMhdRevealAllegation,
  useMhdRevealStatement,
  useMhdRevokeInvestigationAccess,
  useMhdTransitionInvestigationCase,
} from '../Hook';
import {
  MHD_INVESTIGATION_DISPOSITIONS,
  MHD_INVESTIGATION_STATUSES,
  mhdFormatInvestigationCaseType,
  mhdFormatInvestigationConfidentiality,
  mhdFormatInvestigationDisposition,
  mhdFormatInvestigationStatus,
  type MhdInvestigationDisposition,
  type MhdInvestigationStatus,
} from '../Types';
import { MhdAccessGrantPanel } from './MhdAccessGrantPanel';
import { MhdCaseTypeBadge } from './MhdCaseTypeBadge';
import { MhdDispositionBadge } from './MhdDispositionBadge';
import { MhdInvestigationStatusBadge } from './MhdInvestigationStatusBadge';
import { MhdPartyPanel } from './MhdPartyPanel';

/**
 * `/investigations/:caseId`.
 *
 * Route-entry page: reads `useMhdAuth()` and `useParams()` itself, per the app
 * convention. The case facts come from `get` (which returns everything EXCEPT the
 * allegation ciphertext). The allegation is shown ONLY after the user clicks
 * "Reveal allegation" — never fetched on mount — because each reveal is audited
 * server-side and must be a deliberate act. The same holds for party statements.
 *
 * There is NO role gate anywhere on this page. Reaching it at all means the
 * viewer holds a grant (or is Platform Admin, handled server-side); every RPC
 * re-asserts the grant, so the components manage grants, parties and transitions
 * without a single role check — which is the whole access model: per case, by
 * grant, never by role.
 */
const INVESTIGATION_STATUS_FINDINGS_ID = 'investigation-status-findings';

export function MhdInvestigationCaseDetailPage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';

  const investigation = useMhdInvestigationCase(caseId || null);
  const parties = useMhdInvestigationParties(caseId || null);
  const grants = useMhdInvestigationGrants(caseId || null);
  const people = useMhdInvestigationPeople(companyId || null);

  const transition = useMhdTransitionInvestigationCase(caseId || null);
  const assign = useMhdAssignInvestigator(caseId || null);
  const revealAllegation = useMhdRevealAllegation();
  const revealStatement = useMhdRevealStatement();
  const addParty = useMhdAddInvestigationParty(caseId || null);
  const grantAccess = useMhdGrantInvestigationAccess(caseId || null);
  const revokeAccess = useMhdRevokeInvestigationAccess(caseId || null);

  // ----- Allegation reveal state (in-memory only; never cached, never on mount) -----
  const [allegation, setAllegation] = useState<string | null>(null);

  // ----- Transition form state -----
  const [newStatus, setNewStatus] = useState<MhdInvestigationStatus>('OPEN');
  const [disposition, setDisposition] = useState<MhdInvestigationDisposition | ''>('');
  const [finding, setFinding] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // ----- Assignment state -----
  const [investigatorId, setInvestigatorId] = useState('');

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person: { id: string; firstName?: string; lastName?: string }) => ({
        id: person.id,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(' '),
      })),
    [people.data],
  );

  async function handleReveal() {
    // Deliberate, audited: fired only from the button click, never on load.
    const plain = await revealAllegation.mutateAsync(caseId);
    setAllegation(plain ?? '(no allegation recorded)');
  }

  async function submitTransition() {
    if (newStatus === 'CLOSED' && !disposition) {
      setTransitionError('Closing an investigation requires a disposition.');
      return;
    }
    setTransitionError(null);
    await transition.mutateAsync({
      caseId,
      newStatus,
      disposition: disposition || null,
      finding: finding.trim() || null,
    });
    setFinding('');
  }

  // Opens the existing status/disposition transition panel preset to CLOSED,
  // rather than performing any delete. Closing already requires a disposition
  // (enforced in submitTransition above), so this only stages the flow — it
  // does not submit on its own.
  function openCloseFlow() {
    setNewStatus('CLOSED');
    setTransitionError(null);
    document
      .getElementById(INVESTIGATION_STATUS_FINDINGS_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function submitAssign() {
    if (!investigatorId) return;
    await assign.mutateAsync({ caseId, investigator: investigatorId });
    setInvestigatorId('');
  }

  if (investigation.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  // A denied/not-found case returns the identical non-disclosing error server-side;
  // to the page it is simply "not available".
  if (!investigation.data) {
    return <p className="text-sm text-muted-foreground">Investigation not available.</p>;
  }

  const detail = investigation.data;

  return (
    <div className="space-y-6">
      {/* ----- Case facts (everything except the allegation) ----- */}
      <MhdPageHeader
        backTo="/investigations"
        backLabel="Investigations"
        title={mhdFormatInvestigationCaseType(detail.caseType)}
        chips={
          <>
            <MhdCaseTypeBadge caseType={detail.caseType} />
            <MhdInvestigationStatusBadge status={detail.status} />
            <MhdDispositionBadge disposition={detail.disposition} />
          </>
        }
        description={
          <>
            <span className="font-mono">{detail.referenceId}</span>
            {' · '}
            {mhdFormatInvestigationConfidentiality(detail.confidentialityLevel)} confidentiality
            {detail.severity ? ` · severity ${detail.severity}` : ''}
            {detail.closedAt ? ` · closed ${detail.closedAt}` : ''}
          </>
        }
      />

      <MhdInvestigationCaseRecordTabs
        caseId={caseId}
        active="detail"
        onDelete={openCloseFlow}
        deleteLabel="Close Case"
        skipConfirm
      />

      {/* ----- The reveal-gated allegation ----- */}
      <MhdCard className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Allegation</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Encrypted at rest. Revealing is audited, so it happens only when you ask for it.
            </p>
          </div>
          {allegation === null ? (
            <button
              type="button"
              disabled={revealAllegation.isPending}
              onClick={() => void handleReveal()}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              {revealAllegation.isPending ? 'Revealing…' : 'Reveal allegation'}
            </button>
          ) : null}
        </div>
        {allegation === null ? (
          <p className="text-sm text-muted-foreground">Hidden — click reveal to view (audited).</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground">{allegation}</p>
        )}
      </MhdCard>

      {/* ----- Status / disposition / findings ----- */}
      <MhdCard id={INVESTIGATION_STATUS_FINDINGS_ID} className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Status & findings</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="newStatus" className="block text-sm font-medium text-foreground">
              Move to
            </label>
            <select
              id="newStatus"
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as MhdInvestigationStatus)}
              className="mt-1 rounded-md border border-border px-3 py-2 text-sm"
            >
              {MHD_INVESTIGATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {mhdFormatInvestigationStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="disposition" className="block text-sm font-medium text-foreground">
              Disposition{' '}
              {newStatus === 'CLOSED' ? (
                <span className="font-normal text-muted-foreground">(required to close)</span>
              ) : (
                <span className="font-normal text-muted-foreground">(optional)</span>
              )}
            </label>
            <select
              id="disposition"
              value={disposition}
              onChange={(event) =>
                setDisposition(event.target.value as MhdInvestigationDisposition | '')
              }
              className="mt-1 rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {MHD_INVESTIGATION_DISPOSITIONS.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatInvestigationDisposition(value)}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={transition.isPending}
            onClick={() => void submitTransition()}
            className="px-3 py-2"
          >
            {transition.isPending ? 'Saving…' : 'Update'}
          </Button>
        </div>
        <div>
          <label htmlFor="finding" className="block text-sm font-medium text-foreground">
            Finding summary <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="finding"
            rows={3}
            value={finding}
            onChange={(event) => setFinding(event.target.value)}
            placeholder="The investigation's conclusion, recorded on review or close."
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        {detail.findingSummary ? (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Recorded finding
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {detail.findingSummary}
            </p>
          </div>
        ) : null}
        {transitionError ? <p className="text-xs text-rose-600">{transitionError}</p> : null}
      </MhdCard>

      {/* ----- Assignment ----- */}
      <MhdCard className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Assigned investigator</h2>
        <div className="flex flex-wrap items-end gap-3">
          <select
            value={investigatorId}
            onChange={(event) => setInvestigatorId(event.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="">Select an investigator…</option>
            {peopleOptions.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={assign.isPending || !investigatorId}
            onClick={() => void submitAssign()}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            {assign.isPending ? 'Saving…' : 'Assign'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Assigning transfers the implicit grant to the new investigator, and is audited.
        </p>
      </MhdCard>

      {/* ----- Parties (identities masked server-side; statements reveal-gated) ----- */}
      <MhdPartyPanel
        caseId={caseId}
        parties={parties.data ?? []}
        people={peopleOptions}
        isLoading={parties.isLoading}
        isSubmitting={addParty.isPending}
        onAddParty={async (input) => {
          await addParty.mutateAsync(input);
        }}
        onRevealStatement={(partyId) => revealStatement.mutateAsync(partyId)}
        isRevealing={revealStatement.isPending}
      />

      {/* ----- Access grants (grant-gated, not role-gated) ----- */}
      <MhdAccessGrantPanel
        caseId={caseId}
        grants={grants.data ?? []}
        people={peopleOptions}
        isLoading={grants.isLoading}
        isSubmitting={grantAccess.isPending || revokeAccess.isPending}
        onGrant={async (input) => {
          await grantAccess.mutateAsync(input);
        }}
        onRevoke={async (input) => {
          await revokeAccess.mutateAsync(input);
        }}
      />

      <div className="flex justify-end border-t border-border pt-4">
        <MhdDetailActions onDelete={openCloseFlow} deleteLabel="Close Case" skipConfirm />
      </div>
    </div>
  );
}
