import { useMemo, useState } from 'react';
import type { MhdInvestigationGrant, MhdInvestigationGrantInput } from '../Types';

interface UserOption {
  id: string;
  displayName: string;
}

interface Props {
  caseId: string;
  grants: MhdInvestigationGrant[];
  /** Candidate users to grant (the company roster). */
  people: UserOption[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  onGrant: (input: MhdInvestigationGrantInput) => Promise<void>;
  onRevoke: (input: MhdInvestigationGrantInput) => Promise<void>;
}

/**
 * Who can see this case — and the controls to grant or revoke that access.
 *
 * There is DELIBERATELY no role branch in this component. Access to grant access
 * is itself access: if the viewer can see this case at all, they reached it
 * through a grant (or are Platform Admin, handled server-side), and that is
 * exactly the condition the grant/revoke RPCs require. So the panel renders its
 * controls whenever it renders — it does not, and must not, check the viewer's
 * role. An ungranted user never gets this far, because the case does not appear
 * in their list and `get` denies them; the RPC re-asserts grant-holder status
 * regardless, so the UI does not need to (and cannot correctly) gate on role.
 */
export function MhdAccessGrantPanel({
  caseId,
  grants,
  people,
  isLoading = false,
  isSubmitting = false,
  onGrant,
  onRevoke,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState('');

  const nameById = useMemo(
    () => new Map(people.map((person) => [person.id, person.displayName])),
    [people],
  );

  const grantedIds = useMemo(() => new Set(grants.map((grant) => grant.userId)), [grants]);
  const grantablePeople = useMemo(
    () => people.filter((person) => !grantedIds.has(person.id)),
    [people, grantedIds],
  );

  async function submitGrant() {
    if (!selectedUserId) return;
    await onGrant({ caseId, userId: selectedUserId });
    setSelectedUserId('');
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Access</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Who can see this case. Anyone here can grant or revoke access — access to grant is access.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4">
        <div className="flex-1">
          <label htmlFor="grantUser" className="block text-sm font-medium text-neutral-700">
            Grant access to
          </label>
          <select
            id="grantUser"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Select a user…</option>
            {grantablePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={isSubmitting || !selectedUserId}
          onClick={() => void submitGrant()}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Grant'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading access list…</p>
      ) : grants.length === 0 ? (
        <p className="text-sm text-neutral-500">No explicit grants on this case yet.</p>
      ) : (
        <ul className="space-y-2">
          {grants.map((grant) => (
            <li
              key={grant.userId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {nameById.get(grant.userId) ?? grant.userId}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Granted {grant.grantedAt}
                  {grant.grantedBy
                    ? ` by ${nameById.get(grant.grantedBy) ?? grant.grantedBy}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void onRevoke({ caseId, userId: grant.userId })}
                className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 disabled:opacity-50"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
