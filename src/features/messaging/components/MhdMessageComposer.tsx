import { Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mhdSendMessageSchema } from '../Schemas';
import { useMhdSendMessage } from '../Hook';

interface MhdMessageComposerProps {
  threadId: string;
}

export function MhdMessageComposer({ threadId }: MhdMessageComposerProps) {
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
      await send.mutateAsync({ body: parsed.data.body });
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-4">
      <label className="sr-only" htmlFor="mhd-message-body">
        Message
      </label>
      <div className="flex gap-2">
        <textarea
          id="mhd-message-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          className="min-h-20 flex-1 resize-y rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-focus-ring"
          placeholder="Write a message"
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
