import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { MhdMessage } from '../Types';

interface MhdMessageItemProps {
  message: MhdMessage;
  currentUserId: string | null;
  canDelete: boolean;
  onDelete: (messageId: string) => void;
}

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortUserId(value: string): string {
  return value.slice(0, 8);
}

export function MhdMessageItem({ message, currentUserId, canDelete, onDelete }: MhdMessageItemProps) {
  const mine = message.senderUserId === currentUserId;
  const deleted = Boolean(message.deletedAt);

  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-lg border px-3 py-2',
          mine ? 'border-accent/30 bg-accent-tint' : 'border-border bg-white',
          deleted && 'border-dashed bg-slate-50',
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>{mine ? 'You' : `User ${shortUserId(message.senderUserId)}`}</span>
          <span>{formatWhen(message.createdAt)}</span>
        </div>
        <p className={cn('whitespace-pre-wrap text-sm text-foreground', deleted && 'italic text-muted-foreground')}>
          {deleted ? 'Message deleted' : message.body}
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">
            {message.editedAt && !deleted ? 'Edited' : ''}
          </span>
          {canDelete && !deleted && (
            <Button
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onDelete(message.id)}
              aria-label="Delete message"
              title="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
