import { MessageSquare } from 'lucide-react';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { cn } from '@/utils/cn';
import type { MhdMessageThreadWithMeta } from '../Types';

interface MhdMessageThreadListProps {
  threads: MhdMessageThreadWithMeta[];
  selectedThreadId: string | null;
  isLoading?: boolean;
  currentUserId: string | null;
  onSelect: (threadId: string) => void;
}

function formatWhen(value: string | null): string {
  if (!value) return 'No messages';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function otherParticipants(
  participants: { userId: string; displayName: string }[],
  currentUserId: string | null,
): string[] {
  return participants.filter((p) => p.userId !== currentUserId).map((p) => p.displayName);
}

function formatParticipants(others: string[]): string {
  if (others.length === 0) return 'No other participants';
  const shown = others.slice(0, 3);
  const remaining = others.length - shown.length;
  return remaining > 0 ? `${shown.join(', ')} +${remaining} more` : shown.join(', ');
}

export function MhdMessageThreadList({
  threads,
  selectedThreadId,
  isLoading,
  currentUserId,
  onSelect,
}: MhdMessageThreadListProps) {
  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p>;
  }

  if (threads.length === 0) {
    return (
      <MhdEmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Start a direct message with another user."
        className="px-4"
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {threads.map((thread) => {
        const selected = thread.id === selectedThreadId;
        const others = otherParticipants(thread.participants, currentUserId);
        return (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelect(thread.id)}
            className={cn(
              'grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              selected && 'bg-accent-tint/60',
            )}
          >
            <span className="flex min-w-0 items-center justify-between gap-3">
              <span className="truncate text-sm font-semibold text-foreground">
                {thread.subject || thread.lastMessageBody || 'Direct message'}
              </span>
              {thread.unreadCount > 0 && (
                <MhdBadge variant="accent" className="shrink-0">
                  {thread.unreadCount}
                </MhdBadge>
              )}
            </span>
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {thread.lastMessageBody ?? 'No messages yet'}
            </span>
            <span className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span className="min-w-0 truncate" title={others.length > 0 ? others.join(', ') : 'No other participants'}>
                {formatParticipants(others)}
              </span>
              <span>{formatWhen(thread.lastMessageAt)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
