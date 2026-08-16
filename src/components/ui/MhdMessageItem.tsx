import { ChevronDown, ChevronRight, Pencil, Reply, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdRowActionsMenu, type MhdRowActionsMenuAction } from '@/components/ui/MhdRowActionsMenu';
import { cn } from '@/utils/cn';
import { useMhdDeleteMessage, useMhdEditMessage, useMhdMessageReplies } from '@/features/messaging/Hook';
import type { MhdMessage } from '@/features/messaging/Types';
import { MhdMessageComposer } from './MhdMessageComposer';

interface MhdMessageItemProps {
  message: MhdMessage;
  threadId: string;
  currentUserId: string | null;
  resolveSenderName: (userId: string) => string | null;
  currentUserIsOwner: boolean;
  canDelete: boolean;
  isReply?: boolean;
}

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function MhdMessageItem({
  message,
  threadId,
  currentUserId,
  resolveSenderName,
  currentUserIsOwner,
  canDelete,
  isReply = false,
}: MhdMessageItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body ?? '');
  const [mutationError, setMutationError] = useState<string | null>(null);
  const replies = useMhdMessageReplies(showReplies ? message.id : null);
  const editMessage = useMhdEditMessage(threadId);
  const deleteMessage = useMhdDeleteMessage(threadId);
  const mine = message.senderUserId === currentUserId;
  const deleted = Boolean(message.deletedAt);
  const canEdit = mine && !deleted;

  async function handleSaveEdit() {
    setMutationError(null);
    try {
      await editMessage.mutateAsync({
        messageId: message.id,
        body: editBody,
        parentMessageId: isReply ? message.parentMessageId ?? undefined : undefined,
      });
      setIsEditing(false);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Unable to edit message.');
    }
  }

  function handleDelete() {
    setMutationError(null);
    deleteMessage.mutate(
      { messageId: message.id, parentMessageId: isReply ? message.parentMessageId ?? undefined : undefined },
      {
        onSuccess: () => setMutationError(null),
        onError: (err) => setMutationError(err instanceof Error ? err.message : 'Unable to delete message.'),
      },
    );
  }

  const actions: MhdRowActionsMenuAction[] = [
    ...(!isReply
      ? [
          {
            key: 'reply',
            label: 'Reply',
            icon: Reply,
            onSelect: () => setShowReplies(true),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            key: 'edit',
            label: 'Edit',
            icon: Pencil,
            onSelect: () => {
              setMutationError(null);
              setEditBody(message.body ?? '');
              setIsEditing(true);
            },
          },
        ]
      : []),
    ...(canDelete && !deleted
      ? [
          {
            key: 'delete',
            label: 'Delete',
            icon: Trash2,
            destructive: true,
            onSelect: handleDelete,
          },
        ]
      : []),
  ];
  const replyLabel =
    message.replyCount === 0
      ? 'Reply'
      : `${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}`;

  return (
    <li className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-lg border px-3 py-2',
          mine ? 'border-accent/30 bg-accent-tint' : 'border-border bg-white',
          deleted && 'border-dashed bg-slate-50',
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>{mine ? 'You' : resolveSenderName(message.senderUserId) ?? 'Unknown user'}</span>
          <span>{formatWhen(message.createdAt)}</span>
        </div>
        {isEditing ? (
          <div>
            <textarea
              value={editBody}
              onChange={(event) => setEditBody(event.target.value)}
              rows={2}
              className="w-full resize-y rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-focus-ring"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="primary"
                className="h-7 px-2 text-xs"
                onClick={handleSaveEdit}
                disabled={editMessage.isPending}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setEditBody(message.body ?? '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className={cn('whitespace-pre-wrap text-sm text-foreground', deleted && 'italic text-muted-foreground')}>
            {deleted ? 'Message deleted' : message.body}
          </p>
        )}
        {mutationError && <p className="mt-1 text-xs text-red-600">{mutationError}</p>}
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">
            {message.editedAt && !deleted ? 'Edited' : ''}
          </span>
          <MhdRowActionsMenu actions={actions} />
        </div>
      </div>
      {!isReply && (message.replyCount > 0 || showReplies) && (
        <div className="mt-1 w-full max-w-[78%]">
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => setShowReplies((prev) => !prev)}>
            {showReplies ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
            {replyLabel}
          </Button>
          {showReplies && (
            <div className="mt-2">
              <ul className="mt-2 space-y-2 border-l-2 border-border pl-3">
                {(replies.data ?? []).map((reply) => (
                  <MhdMessageItem
                    key={reply.id}
                    message={reply}
                    threadId={threadId}
                    currentUserId={currentUserId}
                    resolveSenderName={resolveSenderName}
                    currentUserIsOwner={currentUserIsOwner}
                    canDelete={reply.senderUserId === currentUserId || currentUserIsOwner}
                    isReply
                  />
                ))}
              </ul>
              <MhdMessageComposer threadId={threadId} parentMessageId={message.id} compact />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
