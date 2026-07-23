import { X } from 'lucide-react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import type { MhdActivityParticipantRole } from '../Types';
import { mhdFormatActivityParticipantRole } from '../Types';

const ROLE_ORDER: MhdActivityParticipantRole[] = ['FACILITATOR', 'PARTICIPANT', 'OBSERVER'];
// The facilitator carries the module accent; everyone else reads neutral. The
// role suffix in the label keeps the distinction (§8: never color-alone).
const ROLE_VARIANTS: Record<MhdActivityParticipantRole, MhdBadgeVariant> = {
  FACILITATOR: 'accent',
  PARTICIPANT: 'neutral',
  OBSERVER: 'neutral',
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
    return <p className="text-sm text-muted-foreground">No participants</p>;
  }

  const sorted = [...participants].sort((a, b) => {
    const rankA = a.role ? ROLE_ORDER.indexOf(a.role) : ROLE_ORDER.length;
    const rankB = b.role ? ROLE_ORDER.indexOf(b.role) : ROLE_ORDER.length;
    return rankA - rankB;
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((participant) => (
        <MhdBadge
          key={participant.id}
          variant={participant.role ? ROLE_VARIANTS[participant.role] : 'neutral'}
        >
          {participant.displayName}
          {participant.role ? (
            <span className="text-[10px] font-normal opacity-70">
              · {mhdFormatActivityParticipantRole(participant.role)}
            </span>
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
        </MhdBadge>
      ))}
    </div>
  );
}
