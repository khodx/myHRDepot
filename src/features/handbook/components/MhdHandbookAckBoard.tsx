import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdAssignAcknowledgment,
  useMhdHandbookAckStatus,
  useMhdHandbookPeople,
  useMhdRequestAcknowledgmentSignature,
} from '../Hook';
import {
  mhdFormatHandbookAckStatus,
  mhdIsAcknowledgmentOverdue,
  mhdNeedsSignatureRequest,
  type MhdHandbookAckStatusRow,
} from '../Types';

interface Props {
  companyId: string;
  /** The published version whose acknowledgments this board tracks. */
  versionId: string;
  /**
   * Whether this handbook requires a signed receipt (`handbooks.requires_signature`).
   * When it does, assigning someone also sends them the signature request, and the
   * board offers to send (or re-send) one for any pending acknowledgment without a live
   * request.
   */
  requiresSignature: boolean;
}

const SIGNATURE_BADGE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  IN_PROGRESS: 'warning',
  DECLINED: 'error',
  EXPIRED: 'error',
  VOIDED: 'neutral',
};

function formatSignatureStatus(status: string | null): string {
  if (!status) return 'Not sent';
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * The acknowledgment board (`ack_status`) — who has and has not acknowledged a
 * version — plus the assign affordance and the signature ceremony. Admin-only: the
 * RPCs re-check the privileged role, and this component lives behind the admin
 * `/handbooks` route.
 *
 * Signature ceremony (when `requiresSignature`): an administrator sends each person a
 * signature request for a short acknowledgment receipt; the person signs from the
 * emailed link and then acknowledges, which the server only allows once the request is
 * COMPLETED. A request that was declined, expired or voided can be sent again.
 */
export function MhdHandbookAckBoard({ companyId, versionId, requiresSignature }: Props) {
  const { profile } = useMhdAuth();
  const board = useMhdHandbookAckStatus(versionId);
  const people = useMhdHandbookPeople(companyId);
  const assign = useMhdAssignAcknowledgment();
  const requestSignature = useMhdRequestAcknowledgmentSignature();

  const [personId, setPersonId] = useState('');
  const [busyAckId, setBusyAckId] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [ceremonyError, setCeremonyError] = useState<string | null>(null);
  const [inviteWarnings, setInviteWarnings] = useState<string[]>([]);

  // people.data is MhdPerson[]; the directory already carries a server-composed
  // displayName, so use it rather than reassembling the name here.
  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map((person) => ({
        id: person.id,
        displayName: person.displayName,
      })),
    [people.data],
  );

  const rows = board.data ?? [];
  const missingSignature = rows.filter(mhdNeedsSignatureRequest);

  async function sendSignature(row: Pick<MhdHandbookAckStatusRow, 'id' | 'personId'>) {
    if (!profile?.userId) throw new Error('You must be signed in to send a signature request.');
    const result = await requestSignature.mutateAsync({
      ackId: row.id,
      companyId,
      personId: row.personId,
      actorUserId: profile.userId,
    });
    return result.invitationErrors;
  }

  async function handleAssign() {
    if (!personId) return;
    setCeremonyError(null);
    setInviteWarnings([]);
    const assigned = await assign.mutateAsync({ versionId, personId });
    setPersonId('');
    if (requiresSignature) {
      // The receipt is per acknowledgment, so it can only be made once the row exists.
      setBusyAckId(assigned.id);
      try {
        setInviteWarnings(await sendSignature({ id: assigned.id, personId }));
      } catch (error) {
        setCeremonyError(
          error instanceof Error
            ? `Assigned, but the signature request was not sent: ${error.message}`
            : 'Assigned, but the signature request was not sent.',
        );
      } finally {
        setBusyAckId(null);
      }
    }
  }

  async function handleSendOne(row: MhdHandbookAckStatusRow) {
    setCeremonyError(null);
    setInviteWarnings([]);
    setBusyAckId(row.id);
    try {
      setInviteWarnings(await sendSignature(row));
    } catch (error) {
      setCeremonyError(
        error instanceof Error ? error.message : 'Could not send the signature request.',
      );
    } finally {
      setBusyAckId(null);
    }
  }

  async function handleSendAll() {
    setCeremonyError(null);
    setInviteWarnings([]);
    setIsSendingAll(true);
    const failures: string[] = [];
    const warnings: string[] = [];
    // One at a time: each one renders a document and reaches the e-signature engine.
    for (const row of missingSignature) {
      try {
        warnings.push(...(await sendSignature(row)));
      } catch (error) {
        failures.push(
          `${row.personDisplayName}: ${error instanceof Error ? error.message : 'could not be sent'}`,
        );
      }
    }
    setIsSendingAll(false);
    setInviteWarnings(warnings);
    if (failures.length > 0) setCeremonyError(failures.join(' · '));
  }

  const busy = assign.isPending || busyAckId !== null || isSendingAll;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Acknowledgments</h2>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="ackPerson" className="block text-xs font-medium text-muted-foreground">
              Assign to
            </label>
            <select
              id="ackPerson"
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
              className="mt-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">Choose a person…</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => void handleAssign()}
            disabled={!personId || busy}
            className="py-1.5"
          >
            {assign.isPending
              ? 'Assigning…'
              : busyAckId
                ? 'Sending signature request…'
                : requiresSignature
                  ? 'Assign & Request Signature'
                  : 'Assign'}
          </Button>
        </div>
      </div>

      {requiresSignature && missingSignature.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-sm text-amber-900">
            {missingSignature.length} pending{' '}
            {missingSignature.length === 1 ? 'acknowledgment has' : 'acknowledgments have'} no live
            signature request.
          </p>
          <Button
            variant="secondary"
            className="py-1.5"
            disabled={busy}
            onClick={() => void handleSendAll()}
          >
            {isSendingAll ? 'Sending…' : 'Send All Missing Requests'}
          </Button>
        </div>
      ) : null}

      {assign.isError ? (
        <p className="text-xs text-rose-600">
          {assign.error instanceof Error
            ? assign.error.message
            : 'Could not assign the acknowledgment.'}
        </p>
      ) : null}
      {ceremonyError ? (
        <p className="text-xs text-rose-600" role="alert">
          {ceremonyError}
        </p>
      ) : null}
      {inviteWarnings.length > 0 ? (
        <p className="text-xs text-amber-700" role="status">
          The signature request exists, but an invitation email failed: {inviteWarnings.join(' · ')}
        </p>
      ) : null}

      {board.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading acknowledgments…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one has been assigned this version yet.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Person</MhdTh>
                <MhdTh>Status</MhdTh>
                {requiresSignature ? <MhdTh>Signature</MhdTh> : null}
                <MhdTh>Due</MhdTh>
                <MhdTh>Acknowledged</MhdTh>
                {requiresSignature ? <MhdTh /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MhdTr key={row.id}>
                  <MhdTd>{row.personDisplayName}</MhdTd>
                  <MhdTd>
                    <MhdBadge variant={row.status === 'ACKNOWLEDGED' ? 'success' : 'warning'}>
                      {mhdFormatHandbookAckStatus(row.status)}
                    </MhdBadge>
                  </MhdTd>
                  {requiresSignature ? (
                    <MhdTd>
                      <MhdBadge
                        variant={SIGNATURE_BADGE[row.esignatureStatus ?? ''] ?? 'neutral'}
                        hideIcon
                      >
                        {formatSignatureStatus(row.esignatureStatus)}
                      </MhdBadge>
                    </MhdTd>
                  ) : null}
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {row.dueAt ? new Date(row.dueAt).toLocaleDateString() : '—'}
                    {mhdIsAcknowledgmentOverdue(row.dueAt, row.status) ? (
                      <MhdBadge variant="error" className="ml-2" hideIcon>
                        Overdue
                      </MhdBadge>
                    ) : null}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString() : '—'}
                  </MhdTd>
                  {requiresSignature ? (
                    <MhdTd className="whitespace-nowrap text-right">
                      {mhdNeedsSignatureRequest(row) ? (
                        <button
                          type="button"
                          onClick={() => void handleSendOne(row)}
                          disabled={busy}
                          className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50"
                        >
                          {busyAckId === row.id
                            ? 'Sending…'
                            : row.esignatureRequestId
                              ? 'Send Again'
                              : 'Request Signature'}
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
  );
}
