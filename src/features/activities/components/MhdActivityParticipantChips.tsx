import { X } from 'lucide-react';
import type { MhdActivityParticipantRole } from '../Types';
import { mhdFormatActivityParticipantRole } from '../Types';

const ROLE_ORDER: MhdActivityParticipantRole[] = ['FACILITATOR', 'PARTICIPANT', 'OBSERVER'];
const ROLE_STYLES: Record<MhdActivityParticipantRole, string> = {
  FACILITATOR: 'bg-indigo-100 text-indigo-800',
  PARTICIPANT: 'bg-neutral-100 text-neutral-700',
  OBSERVER: 'border border-neutral-200 bg-neutral-50 text-neutral-500',
};

export interface MhdActivityParticipantChipItem {
  id: string;
  displayName: string;
  role?: MhdActivityParticipantRole;
}

interface Props {
  participants: MhdActivityParticipantChipItem[];
  onRemove?: (participantId: string) => void;
}

export function MhdActivityParticipantChips({ participants, onRemove }: Props) {
  if (participants.length === 0) {
    return <p className="text-sm text-neutral-400">No participants</p>;
  }

  const sorted = [...participants].sort((a, b) => {
    const rankA = a.role ? ROLE_ORDER.indexOf(a.role) : ROLE_ORDER.length;
    const rankB = b.role ? ROLE_ORDER.indexOf(b.role) : ROLE_ORDER.length;
    return rankA - rankB;
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((participant) => (
        <span
          key={participant.id}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            participant.role ? ROLE_STYLES[participant.role] : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {participant.displayName}
          {participant.role ? (
            <span className="text-[10px] font-normal opacity-70">· {mhdFormatActivityParticipantRole(participant.role)}</span>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${participant.displayName}`}
              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
              onClick={() => onRemove(participant.id)}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}
