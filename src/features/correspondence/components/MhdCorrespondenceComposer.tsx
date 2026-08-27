import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdReplyCorrespondenceSchema } from '../Schemas';
import { useMhdSendCorrespondence } from '../Hook';
import { mhdCorrespondenceHtmlFromText } from '../Service';
import type { MhdCorrespondenceMessage } from '../Types';

interface Props {
  threadId: string;
  lastMessage: MhdCorrespondenceMessage | null;
}

function defaultRecipients(message: MhdCorrespondenceMessage | null): string {
  if (!message) return '';
  if (message.direction === 'INBOUND') return message.senderEmail;
  return message.recipientEmails.join(', ');
}

export function MhdCorrespondenceComposer({ threadId, lastMessage }: Props) {
  const [recipientEmails, setRecipientEmails] = useState(() => defaultRecipients(lastMessage));
  const [ccEmails, setCcEmails] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useMhdSendCorrespondence(threadId);

  const defaultRecipientValue = useMemo(() => defaultRecipients(lastMessage), [lastMessage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = mhdReplyCorrespondenceSchema.safeParse({
      recipientEmails: recipientEmails || defaultRecipientValue,
      ccEmails,
      body,
      inReplyToMessageId: lastMessage?.id ?? null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the reply.');
      return;
    }

    setError(null);
    try {
      await send.mutateAsync({
        threadId,
        recipientEmails: parsed.data.recipientEmails,
        ccEmails: parsed.data.ccEmails,
        bodyHtml: mhdCorrespondenceHtmlFromText(parsed.data.body),
        bodyText: parsed.data.body,
        inReplyToMessageId: parsed.data.inReplyToMessageId,
      });
      setBody('');
      setRecipientEmails(defaultRecipientValue);
      setCcEmails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reply.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border p-4">
      <MhdFormFieldStack>
        <label className="text-sm font-medium text-foreground">
          To
          <input
            value={recipientEmails || defaultRecipientValue}
            onChange={(event) => setRecipientEmails(event.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          CC
          <input
            value={ccEmails}
            onChange={(event) => setCcEmails(event.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </label>
      </MhdFormFieldStack>
      <label className="sr-only" htmlFor="mhd-correspondence-reply-body">
        Reply
      </label>
      <div className="flex gap-2">
        <textarea
          id="mhd-correspondence-reply-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          className="min-h-24 flex-1 resize-y rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-focus-ring"
          placeholder="Write a reply"
        />
        <Button type="submit" disabled={send.isPending} className="self-end">
          <Send className="h-4 w-4" aria-hidden />
          Send
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
