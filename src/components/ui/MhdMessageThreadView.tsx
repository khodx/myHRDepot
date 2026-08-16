import { MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { mhdTaskService } from '@/features/tasks/Service';
import { useMhdMessageThread, useMhdMessages, useMhdMarkThreadRead } from '@/features/messaging/Hook';
import { MhdManageParticipantsPanel } from './MhdManageParticipantsPanel';
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

  const companyId = thread.data?.companyId ?? null;
  const assignableUsers = useQuery({
    queryKey: ['mhd-messaging', 'assignable-users', companyId ?? ''],
    queryFn: () => mhdTaskService.listAssignableUsers(companyId!),
    enabled: Boolean(companyId),
  });
  const senderNamesByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of assignableUsers.data ?? []) {
      map.set(user.id, user.displayName);
    }
    return map;
  }, [assignableUsers.data]);
  const resolveSenderName = useCallback(
    (userId: string) => senderNamesByUserId.get(userId) ?? null,
    [senderNamesByUserId],
  );

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
            <MhdManageParticipantsPanel
              threadId={threadId}
              companyId={thread.data?.companyId ?? null}
              participants={thread.data?.participants ?? []}
              resolveSenderName={resolveSenderName}
              currentUserIsOwner={currentUserIsOwner}
            />
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
                threadId={threadId}
                currentUserId={currentUserId}
                resolveSenderName={resolveSenderName}
                currentUserIsOwner={currentUserIsOwner}
                canDelete={message.senderUserId === currentUserId || currentUserIsOwner}
              />
            ))}
          </ul>
        )}
      </div>

      <MhdMessageComposer threadId={threadId} />
    </MhdCard>
  );
}
