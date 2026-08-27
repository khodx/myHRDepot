import { Link2, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { useMhdCorrespondenceMessages, useMhdCorrespondenceThread } from '../Hook';
import type { MhdCorrespondenceMessage } from '../Types';
import { MhdCorrespondenceComposer } from './MhdCorrespondenceComposer';
import { MhdLinkCorrespondenceThreadDialog } from './MhdLinkCorrespondenceThreadDialog';

interface Props {
  threadId: string | null;
  allowLinkAction?: boolean;
}

function formatWhen(value: string | null): string {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function MessageBubble({ message }: { message: MhdCorrespondenceMessage }) {
  const isOutbound = message.direction === 'OUTBOUND';
  return (
    <li className={isOutbound ? 'flex justify-end' : 'flex justify-start'}>
      <article
        className={`max-w-[42rem] rounded-lg border px-4 py-3 ${
          isOutbound
            ? 'border-accent-tint bg-accent-tint/50'
            : 'border-border bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <MhdBadge variant={isOutbound ? 'info' : 'neutral'} hideIcon>
            {message.direction}
          </MhdBadge>
          <span>{message.senderDisplayName || message.senderEmail}</span>
          <span>{formatWhen(message.sentAt ?? message.receivedAt ?? message.createdAt)}</span>
          {message.status === 'FAILED' ? <MhdBadge variant="error">Failed</MhdBadge> : null}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
          {message.bodyText || message.bodyHtml?.replace(/<[^>]*>/g, ' ') || '(No body)'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          To: {message.recipientEmails.join(', ') || 'None'}
          {' | CC: '}{message.ccEmails.join(', ') || 'Not provided'}
        </p>
        <p className="mt-2 text-xs text-red-600">Failure reason: {message.failureReason || 'Not provided'}</p>
      </article>
    </li>
  );
}

export function MhdCorrespondenceThreadView({ threadId, allowLinkAction }: Props) {
  const thread = useMhdCorrespondenceThread(threadId);
  const messages = useMhdCorrespondenceMessages(threadId);
  const [linkOpen, setLinkOpen] = useState(false);

  const sortedMessages = useMemo(
    () =>
      [...(messages.data ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages.data],
  );
  const lastMessage = sortedMessages[sortedMessages.length - 1] ?? null;
  const canLink = allowLinkAction && thread.data && !thread.data.entityType;

  if (!threadId) {
    return (
      <MhdCard className="flex min-h-[32rem] items-center justify-center">
        <MhdEmptyState icon={Mail} title="Select a correspondence thread" />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="flex min-h-[32rem] flex-col overflow-hidden p-0">
      <div className="border-b border-border p-4">
        <MhdCardHeader
          title={thread.data?.subject || 'No subject'}
          action={
            canLink ? (
              <Button variant="secondary" onClick={() => setLinkOpen(true)}>
                <Link2 className="h-4 w-4" aria-hidden />
                Link to record
              </Button>
            ) : undefined
          }
          className="mb-1"
        />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{thread.data?.referenceId ?? ''}</span>
          {thread.data?.entityType && thread.data.entityId ? (
            <span>
              {thread.data.entityType} {thread.data.entityId}
            </span>
          ) : (
            <span>General inbox</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {thread.isLoading || messages.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        ) : sortedMessages.length === 0 ? (
          <MhdEmptyState icon={Mail} title="No messages yet" className="py-16" />
        ) : (
          <ul className="space-y-3">
            {sortedMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        )}
      </div>

      <MhdCorrespondenceComposer threadId={threadId} lastMessage={lastMessage} />
      <MhdLinkCorrespondenceThreadDialog
        open={linkOpen}
        threadId={threadId}
        onClose={() => setLinkOpen(false)}
      />
    </MhdCard>
  );
}
