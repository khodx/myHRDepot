import { Mail } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { cn } from '@/utils/cn';
import type { MhdCorrespondenceThreadWithPreview } from '../Types';

interface Props {
  threads: MhdCorrespondenceThreadWithPreview[];
  selectedThreadId: string | null;
  isLoading?: boolean;
  showLinkBadges?: boolean;
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

export function MhdCorrespondenceThreadList({
  threads,
  selectedThreadId,
  isLoading,
  showLinkBadges,
  onSelect,
}: Props) {
  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading correspondence...</p>;
  }

  if (threads.length === 0) {
    return (
      <MhdEmptyState
        icon={Mail}
        title="No correspondence yet"
        description="Email threads will appear here after they are sent or received."
        className="px-4"
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {threads.map((thread) => {
        const selected = thread.id === selectedThreadId;
        const isLinked = Boolean(thread.entityType && thread.entityId);
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
                {thread.subject || 'No subject'}
              </span>
              {showLinkBadges ? (
                <MhdBadge variant={isLinked ? 'success' : 'neutral'} hideIcon className="shrink-0">
                  {isLinked ? 'Linked' : 'General'}
                </MhdBadge>
              ) : null}
            </span>
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {thread.lastMessagePreview ?? 'No message preview'}
            </span>
            <span className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span>{thread.referenceId}</span>
              <span>{formatWhen(thread.lastMessageAt ?? thread.createdAt)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
