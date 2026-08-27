import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdChecklistInstance, useMhdCompleteChecklistItem } from '../Hook';
import { mhdFormatChecklistValue, type MhdChecklistInstanceItem } from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdChecklistInstanceDetailPage() {
  const { instanceId } = useParams();
  const instance = useMhdChecklistInstance(instanceId ?? null);
  const completeItem = useMhdCompleteChecklistItem(instanceId ?? null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function toggleItem(item: MhdChecklistInstanceItem, isCompleted: boolean) {
    const evidenceNote = notes[item.id] ?? item.evidenceNote ?? '';
    if (isCompleted && item.requiresEvidence && !evidenceNote.trim()) {
      setError('Enter an evidence note before completing this item.');
      return;
    }
    setError(null);
    try {
      await completeItem.mutateAsync({
        itemId: item.id,
        isCompleted,
        evidenceNote: evidenceNote || null,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The item could not be updated.');
    }
  }

  const detail = instance.data;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/my-checklists"
        backLabel="my checklists"
        title={detail?.title ?? 'Checklist'}
        description={detail ? `${detail.referenceId}${detail.dueDate ? ` · Due ${detail.dueDate}` : ''}` : undefined}
      />

      {instance.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading checklist...</p>
      ) : !detail ? (
        <MhdEmptyState
          icon={ClipboardCheck}
          title="Checklist not found"
          description="This checklist is unavailable or you do not have access to it."
        />
      ) : (
        <>
          <MhdCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <MhdBadge variant={detail.status === 'COMPLETED' ? 'neutral' : 'info'}>
                {mhdFormatChecklistValue(detail.status)}
              </MhdBadge>
              <MhdDetailField label="Completed" value={detail.completedAt} />
            </div>
          </MhdCard>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          {detail.items.length === 0 ? (
            <MhdEmptyState
              icon={ClipboardCheck}
              title="No items on this checklist"
              description="This checklist has no items yet."
            />
          ) : (
            <ul className="space-y-3">
              {detail.items.map((item) => (
                <li key={item.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description || 'Not provided'}</p>
                      <dl className="mt-2 space-y-2">
                        <MhdDetailField label="Required" value={item.isRequired ? 'Yes' : 'No'} />
                        <MhdDetailField label="Evidence required" value={item.requiresEvidence ? 'Yes' : 'No'} />
                      </dl>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        disabled={detail.status !== 'IN_PROGRESS' || completeItem.isPending}
                        onChange={(event) => void toggleItem(item, event.target.checked)}
                      />
                      Complete
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                      Evidence note
                      <input
                        className={`mt-1 ${inputClass}`}
                        value={notes[item.id] ?? item.evidenceNote ?? ''}
                        disabled={detail.status !== 'IN_PROGRESS'}
                        onChange={(event) =>
                          setNotes((value) => ({ ...value, [item.id]: event.target.value }))
                        }
                      />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
