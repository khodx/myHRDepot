import { useState } from 'react';
import {
  useMhdApproveParticipant,
  useMhdCloseFeedback,
  useMhdInviteParticipant,
  useMhdReviewParticipants,
} from '../Hook-v2';
import {
  MHD_PARTICIPANT_TYPES,
  mhdFormatParticipantStatus,
  mhdFormatParticipantType,
  mhdOutstandingParticipants,
  type MhdParticipantType,
} from '../Types-v2';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  reviewId: string;
  /** People who can be invited as raters. */
  people: PersonOption[];
  onCloseFeedback?: () => void;
}

/**
 * Who was asked for feedback — and only that. This panel shows the invitation
 * LIST because who was asked is administratively necessary; it never shows what
 * anyone said, because that is not.
 *
 * Two rules from the spec are visible here:
 *
 * - **Nominated vs invited.** A row created by the subject arrives NOMINATED and
 *   needs the reviewer to approve it before it becomes an INVITED request.
 *   Self-selected raters bias upward, so the approval step is the control. This
 *   panel is the reviewer's side of it and shows a clear Approve action on
 *   nominated rows.
 * - **Closing overrides outstanding invitations.** Before the reviewer closes
 *   collection, they are shown exactly how many people can still answer —
 *   mirroring the server's own count — so the decision is made with that number
 *   in front of them, not discovered afterwards.
 */
export function MhdParticipantPanel({ reviewId, people, onCloseFeedback }: Props) {
  const [invitePerson, setInvitePerson] = useState('');
  const [inviteType, setInviteType] = useState<MhdParticipantType>('PEER');
  const [isClosing, setIsClosing] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const participants = useMhdReviewParticipants(reviewId);
  const invite = useMhdInviteParticipant();
  const approve = useMhdApproveParticipant(reviewId);
  const close = useMhdCloseFeedback();

  const rows = participants.data ?? [];
  const outstanding = mhdOutstandingParticipants(rows);

  async function submitInvite() {
    if (!invitePerson) {
      setError('Choose someone to invite.');
      return;
    }
    setError(null);
    await invite.mutateAsync({ reviewId, personId: invitePerson, participantType: inviteType });
    setInvitePerson('');
  }

  async function submitClose() {
    if (!closeReason.trim()) {
      setError('A reason is required to close feedback collection.');
      return;
    }
    setError(null);
    await close.mutateAsync({ reviewId, reason: closeReason.trim() });
    setIsClosing(false);
    onCloseFeedback?.();
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">Feedback participants</h2>
        {outstanding.length > 0 && !isClosing ? (
          <button
            type="button"
            onClick={() => setIsClosing(true)}
            className="text-sm text-neutral-500 underline"
          >
            Close collection
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="invitePerson" className="block text-xs uppercase tracking-wide text-neutral-500">
            Invite
          </label>
          <select
            id="invitePerson"
            value={invitePerson}
            onChange={(event) => setInvitePerson(event.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select someone…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inviteType" className="block text-xs uppercase tracking-wide text-neutral-500">
            As
          </label>
          <select
            id="inviteType"
            value={inviteType}
            onChange={(event) => setInviteType(event.target.value as MhdParticipantType)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            {MHD_PARTICIPANT_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatParticipantType(type)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={invite.isPending}
          onClick={() => void submitInvite()}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
        >
          {invite.isPending ? 'Inviting…' : 'Invite'}
        </button>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}

      {participants.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No participants invited yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {rows.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-neutral-900">{participant.personDisplayName}</p>
                <p className="text-xs text-neutral-500">
                  {mhdFormatParticipantType(participant.participantType)} ·{' '}
                  {mhdFormatParticipantStatus(participant.status)}
                </p>
              </div>
              {participant.status === 'NOMINATED' ? (
                <button
                  type="button"
                  disabled={approve.isPending}
                  onClick={() => void approve.mutateAsync(participant.id)}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 disabled:opacity-50"
                >
                  Approve
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isClosing ? (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            {/* The number the reviewer is overriding, in front of them before they commit. */}
            {outstanding.length} {outstanding.length === 1 ? 'person has' : 'people have'} not yet
            responded. Closing ends collection for everyone; their feedback can no longer be added.
          </p>
          <label htmlFor="closeReason" className="block text-sm font-medium text-neutral-700">
            Reason
          </label>
          <textarea
            id="closeReason"
            rows={2}
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsClosing(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={close.isPending}
              onClick={() => void submitClose()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {close.isPending ? 'Closing…' : 'Close collection'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
