import { useMhdMyInvitations } from '../Hook-v2';
import { mhdFormatParticipantType } from '../Types-v2';

interface Props {
  onOpen: (participantId: string) => void;
}

/**
 * `/performance/invitations` — an invited rater's entire surface.
 *
 * A peer or direct report can see nothing about the review itself: not its
 * content, not its other participants, not who else was asked. This list, drawn
 * from `auth.uid()`, is all they have. It is a SEPARATE route rather than a
 * section of the review precisely because they cannot load the review — a
 * component that tried would surface a permission error to someone who has done
 * nothing wrong.
 */
export function MhdMyFeedbackInvitations({ onOpen }: Props) {
  const invitations = useMhdMyInvitations();

  if (invitations.isLoading) {
    return <p className="p-6 text-sm text-neutral-500">Loading your invitations…</p>;
  }

  const open = (invitations.data ?? []).filter((invitation) => invitation.status === 'INVITED');
  const done = (invitations.data ?? []).filter((invitation) => invitation.status === 'RESPONDED');

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">Feedback requests</h1>
        <p className="mt-1 text-sm text-neutral-600">
          You have been asked to give feedback on these colleagues. Your responses are combined
          with others and shown only in aggregate.
        </p>
      </header>

      {open.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing awaiting your feedback.</p>
      ) : (
        <ul className="space-y-2">
          {open.map((invitation) => (
            <li
              key={invitation.participantId}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{invitation.subjectName}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {mhdFormatParticipantType(invitation.participantType)} feedback · period ending{' '}
                  {invitation.reviewPeriodEnd}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpen(invitation.participantId)}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-50"
              >
                Give feedback
              </button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium text-neutral-700">Submitted</h2>
          <ul className="mt-2 space-y-1 text-sm text-neutral-500">
            {done.map((invitation) => (
              <li key={invitation.participantId}>
                {invitation.subjectName} —{' '}
                {mhdFormatParticipantType(invitation.participantType)} feedback given
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
