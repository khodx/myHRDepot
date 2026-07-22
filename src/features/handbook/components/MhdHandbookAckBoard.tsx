import { useMemo, useState } from 'react';
import {
  useMhdAssignAcknowledgment,
  useMhdHandbookAckStatus,
  useMhdHandbookPeople,
} from '../Hook';
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
        <h2 className="text-base font-semibold text-neutral-900">Acknowledgments</h2>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="ackPerson" className="block text-xs font-medium text-neutral-600">
              Assign to
            </label>
            <select
              id="ackPerson"
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
              className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            >
              <option value="">Choose a person…</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void handleAssign()}
            disabled={!personId || assign.isPending || isRequesting}
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isRequesting ? 'Preparing signature…' : assign.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>

      {assign.isError ? (
        <p className="text-xs text-rose-600">
          {assign.error instanceof Error ? assign.error.message : 'Could not assign the acknowledgment.'}
        </p>
      ) : null}

      {board.isLoading ? (
        <p className="text-sm text-neutral-500">Loading acknowledgments…</p>
      ) : (board.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No one has been assigned this version yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Person</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {(board.data ?? []).map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 text-neutral-800">
                  <td className="py-2 pr-4">{row.personDisplayName}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === 'ACKNOWLEDGED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {mhdFormatHandbookAckStatus(row.status)}
                    </span>
                  </td>
                  <td className="py-2 whitespace-nowrap text-neutral-600">
                    {row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
