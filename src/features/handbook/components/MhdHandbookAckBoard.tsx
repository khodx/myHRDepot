import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAssignAcknowledgment, useMhdHandbookAckStatus, useMhdHandbookPeople } from '../Hook';
import { mhdFormatHandbookAckStatus } from '../Types';

interface Props {
  companyId: string;
  /** The published version whose acknowledgments this board tracks. */
  versionId: string;
  /**
   * APP-LAYER ceremony hook. When provided, the host route creates the e-signature
   * request for this acknowledgment and resolves to its id, which is forwarded to
   * `assign_acknowledgment` as the soft link. When absent, the acknowledgment is
   * assigned with no signature request (the shell path) — the employee can then
   * acknowledge directly. This module never invents an E-Sign RPC; it only passes
   * the id an injected callback returns.
   */
  onRequestSignature?: (personId: string) => Promise<string | null>;
}

/**
 * The acknowledgment board (`ack_status`) — who has and has not acknowledged a
 * version — plus the assign affordance. Admin-only: the RPCs re-check the
 * privileged role, and this component lives behind the admin `/handbooks` route.
 */
export function MhdHandbookAckBoard({ companyId, versionId, onRequestSignature }: Props) {
  const board = useMhdHandbookAckStatus(versionId);
  const people = useMhdHandbookPeople(companyId);
  const assign = useMhdAssignAcknowledgment();

  const [personId, setPersonId] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

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

  async function handleAssign() {
    if (!personId) return;
    // If the host wired the e-sign ceremony, mint the signature request first and
    // forward its id; otherwise assign with no request (shell path).
    let esignatureRequestId: string | null = null;
    if (onRequestSignature) {
      setIsRequesting(true);
      try {
        esignatureRequestId = await onRequestSignature(personId);
      } finally {
        setIsRequesting(false);
      }
    }
    await assign.mutateAsync({ versionId, personId, esignatureRequestId });
    setPersonId('');
  }

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
            disabled={!personId || assign.isPending || isRequesting}
            className="py-1.5"
          >
            {isRequesting ? 'Preparing signature…' : assign.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      </div>

      {assign.isError ? (
        <p className="text-xs text-rose-600">
          {assign.error instanceof Error
            ? assign.error.message
            : 'Could not assign the acknowledgment.'}
        </p>
      ) : null}

      {board.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading acknowledgments…</p>
      ) : (board.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No one has been assigned this version yet.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Person</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Acknowledged</MhdTh>
              </tr>
            </thead>
            <tbody>
              {(board.data ?? []).map((row) => (
                <MhdTr key={row.id}>
                  <MhdTd>{row.personDisplayName}</MhdTd>
                  <MhdTd>
                    <MhdBadge variant={row.status === 'ACKNOWLEDGED' ? 'success' : 'warning'}>
                      {mhdFormatHandbookAckStatus(row.status)}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString() : '—'}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </section>
  );
}
