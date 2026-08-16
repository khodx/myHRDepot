import { Send } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { mhdSendMessageSchema } from '@/features/messaging/Schemas';
import { useMhdSendMessage } from '@/features/messaging/Hook';

interface MhdMessageComposerProps {
  threadId: string;
  parentMessageId?: string | null;
  compact?: boolean;
}

export function MhdMessageComposer({ threadId, parentMessageId, compact = false }: MhdMessageComposerProps) {
  const bodyId = useId();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useMhdSendMessage(threadId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = mhdSendMessageSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the message.');
      return;
    }

    setError(null);
    try {
      await send.mutateAsync({ body: parsed.data.body, parentMessageId });
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'pt-2' : 'border-t border-border p-4'}>
      <label className="sr-only" htmlFor={bodyId}>
        Message
      </label>
      <div className="flex gap-2">
        <textarea
          id={bodyId}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={compact ? 1 : 2}
          className={cn(
            compact ? 'min-h-12' : 'min-h-20',
            'flex-1 resize-y rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-focus-ring',
          )}
          placeholder={parentMessageId ? 'Write a reply' : 'Write a message'}
        />
        <Button type="submit" disabled={send.isPending} className="self-end">
          <Send className="h-4 w-4" aria-hidden />
          Send
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
