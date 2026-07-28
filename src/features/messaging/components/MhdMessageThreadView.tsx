import { MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { useMhdMessageThread, useMhdMessages, useMhdMarkThreadRead } from '../Hook';
import { mhdMessagingService } from '../Service';
import { MhdMessageComposer } from './MhdMessageComposer';
import { MhdMessageItem } from './MhdMessageItem';

interface MhdMessageThreadViewProps {
  threadId: string | null;
  currentUserId: string | null;
}

export function MhdMessageThreadView({ threadId, currentUserId }: MhdMessageThreadViewProps) {
  const thread = useMhdMessageThread(threadId);
  const messages = useMhdMessages(threadId);
  const { mutate: markThreadRead } = useMhdMarkThreadRead(threadId ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (threadId) {
      markThreadRead();
    }
  }, [threadId, markThreadRead]);

  const ownerUserIds = useMemo(
    () => new Set((thread.data?.participants ?? []).filter((p) => p.role === 'OWNER').map((p) => p.userId)),
    [thread.data?.participants],
  );
  const currentUserIsOwner = currentUserId ? ownerUserIds.has(currentUserId) : false;

  async function handleDelete(messageId: string) {
    setError(null);
    try {
      await mhdMessagingService.deleteMessage(messageId);
      await Promise.all([thread.refetch(), messages.refetch()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete message.');
    }
  }

  if (!threadId) {
    return (
      <MhdCard className="flex min-h-[32rem] items-center justify-center">
        <MhdEmptyState icon={MessageSquare} title="Select a conversation" />
      </MhdCard>
    );
  }

  const sortedMessages = [...(messages.data ?? [])].reverse();

  return (
    <MhdCard className="flex min-h-[32rem] flex-col overflow-hidden p-0">
      <div className="border-b border-border p-4">
        <MhdCardHeader
          title={thread.data?.subject || 'Direct message'}
          action={
            <span className="text-xs text-muted-foreground">
              {thread.data?.participants.length ?? 0} participants
            </span>
          }
          className="mb-1"
        />
        <p className="text-xs text-muted-foreground">{thread.data?.referenceId ?? ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {thread.isLoading || messages.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        ) : sortedMessages.length === 0 ? (
          <MhdEmptyState icon={MessageSquare} title="No messages yet" className="py-16" />
        ) : (
          <ul className="space-y-3">
            {sortedMessages.map((message) => (
              <MhdMessageItem
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                canDelete={message.senderUserId === currentUserId || currentUserIsOwner}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
      <MhdMessageComposer threadId={threadId} />
    </MhdCard>
  );
}
