import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mhdLinkCorrespondenceThreadSchema } from '../Schemas';
import { useMhdLinkCorrespondenceThread } from '../Hook';
import {
  MHD_CORRESPONDENCE_ENTITY_TYPES,
  type MhdCorrespondenceEntityType,
} from '../Types';

interface Props {
  open: boolean;
  threadId: string;
  onClose: () => void;
}

export function MhdLinkCorrespondenceThreadDialog({ open, threadId, onClose }: Props) {
  const [entityType, setEntityType] =
    useState<MhdCorrespondenceEntityType>('ACCOMMODATION_CASE');
  const [entityId, setEntityId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const linkThread = useMhdLinkCorrespondenceThread(threadId);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = mhdLinkCorrespondenceThreadSchema.safeParse({ entityType, entityId });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Review the link target.');
      return;
    }

    setError(null);
    try {
      await linkThread.mutateAsync(parsed.data);
      setEntityId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to link thread.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">Link to record</h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <label className="text-sm font-medium text-foreground">
            Record type
            <select
              value={entityType}
              onChange={(event) =>
                setEntityType(event.target.value as MhdCorrespondenceEntityType)
              }
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            >
              {MHD_CORRESPONDENCE_ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Record ID
            <input
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={linkThread.isPending}>
              Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
