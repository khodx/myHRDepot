import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mhdNewCorrespondenceSchema } from '../Schemas';
import { useMhdSendCorrespondence } from '../Hook';
import { mhdCorrespondenceHtmlFromText } from '../Service';

interface Props {
  open: boolean;
  companyId: string;
  entityType?: string;
  entityId?: string;
  onClose: () => void;
  onCreated: (threadId: string) => void;
}

export function MhdNewCorrespondenceDialog({
  open,
  companyId,
  entityType,
  entityId,
  onClose,
  onCreated,
}: Props) {
  const [recipientEmails, setRecipientEmails] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useMhdSendCorrespondence();

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = mhdNewCorrespondenceSchema.safeParse({
      companyId,
      subject,
      recipientEmails,
      ccEmails,
      body,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the correspondence details.');
      return;
    }

    setError(null);
    try {
      const threadId = await send.mutateAsync({
        companyId: parsed.data.companyId,
        subject: parsed.data.subject,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        recipientEmails: parsed.data.recipientEmails,
        ccEmails: parsed.data.ccEmails,
        bodyHtml: mhdCorrespondenceHtmlFromText(parsed.data.body),
        bodyText: parsed.data.body,
      });
      setRecipientEmails('');
      setCcEmails('');
      setSubject('');
      setBody('');
      onCreated(threadId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send correspondence.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">New correspondence</h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              To
              <input
                value={recipientEmails}
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
          </div>
          <label className="text-sm font-medium text-foreground">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>
          {entityType && entityId ? (
            <p className="rounded-md border border-border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
              Linked to {entityType} {entityId}
            </p>
          ) : null}
          <label className="text-sm font-medium text-foreground">
            Message
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={send.isPending}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
