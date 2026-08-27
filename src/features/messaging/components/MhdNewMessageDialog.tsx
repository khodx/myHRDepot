import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import { mhdTaskService } from '@/features/tasks/Service';
import { mhdCreateMessageThreadSchema } from '../Schemas';
import { useMhdCreateMessageThread } from '../Hook';
import type { MhdThreadType } from '../Types';

interface MhdNewMessageDialogProps {
  open: boolean;
  companyId: string | null;
  currentUserId: string | null;
  onClose: () => void;
  onCreated: (threadId: string) => void;
}

export function MhdNewMessageDialog({
  open,
  companyId,
  currentUserId,
  onClose,
  onCreated,
}: MhdNewMessageDialogProps) {
  const [threadType, setThreadType] = useState<MhdThreadType>('DIRECT');
  const [subject, setSubject] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [participantUserIds, setParticipantUserIds] = useState<string[]>([]);
  const [initialBody, setInitialBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createThread = useMhdCreateMessageThread();

  const users = useQuery({
    queryKey: ['mhd-messaging', 'assignable-users', companyId ?? ''],
    queryFn: () => mhdTaskService.listAssignableUsers(companyId!),
    enabled: open && Boolean(companyId),
  });

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = mhdCreateMessageThreadSchema.safeParse({
      companyId,
      threadType,
      subject,
      entityType: entityType || null,
      entityId: entityId || null,
      participantUserIds,
      initialBody,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the message details.');
      return;
    }

    setError(null);
    try {
      const threadId = await createThread.mutateAsync(parsed.data);
      setSubject('');
      setEntityType('');
      setEntityId('');
      setParticipantUserIds([]);
      setInitialBody('');
      setThreadType('DIRECT');
      onCreated(threadId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create message thread.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">New message</h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <MhdFormFieldStack>
            <label className="text-sm font-medium text-foreground">
              Type
              <select
                value={threadType}
                onChange={(event) => setThreadType(event.target.value as MhdThreadType)}
                className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="DIRECT">Direct</option>
                <option value="MODULE">Module</option>
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Subject
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </MhdFormFieldStack>

          <MhdFormFieldStack>
              <label className="text-sm font-medium text-foreground">
                Entity type
                <input
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value)}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Entity id
                <input
                  value={entityId}
                  onChange={(event) => setEntityId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
          </MhdFormFieldStack>

          <div>
            <span className="text-sm font-medium text-foreground">Participants</span>
            <MhdMultiSelectCombobox
              className="mt-1"
              options={(users.data ?? [])
                .filter((user) => user.id !== currentUserId)
                .map((user) => ({
                  id: user.id,
                  label: user.displayName,
                  sublabel: user.email || undefined,
                }))}
              value={participantUserIds}
              onChange={setParticipantUserIds}
              placeholder="Search people…"
              emptyMessage="No matching people."
            />
          </div>

          <label className="text-sm font-medium text-foreground">
            Message
            <textarea
              value={initialBody}
              onChange={(event) => setInitialBody(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createThread.isPending || !companyId}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
