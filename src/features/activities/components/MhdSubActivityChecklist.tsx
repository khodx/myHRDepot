import { ArrowDown, ArrowUp, CheckCircle2, Circle, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS } from '@/features/drafts/Types';
import type { MhdSubActivity } from '../Types';
import { mhdFormatSubActivityStatus } from '../Types';
import { mhdFormatDateTime } from '@/utils/mhdDateFormat';

interface Props {
  activityId: string;
  subActivities: MhdSubActivity[];
  canMutate: boolean;
  isSubmitting: boolean;
  onToggleComplete: (subActivity: MhdSubActivity) => void;
  onAdd: (title: string) => Promise<void>;
  onDelete: (subActivity: MhdSubActivity) => void;
  onReorder: (subActivity: MhdSubActivity, direction: 'up' | 'down') => void;
}

export function MhdSubActivityChecklist({
  activityId,
  subActivities,
  canMutate,
  isSubmitting,
  onToggleComplete,
  onAdd,
  onDelete,
  onReorder,
}: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const draft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.activityChecklistItem,
    draftKey: activityId,
    enabled: isAdding,
  });

  const ordered = [...subActivities].sort((a, b) => a.sortOrder - b.sortOrder);
  const doneCount = ordered.filter((item) => item.status === 'COMPLETED').length;

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    await onAdd(title);
    await draft.discard();
    setNewTitle('');
    setIsAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ListChecks className="h-4 w-4" />
        {ordered.length > 0 ? `${doneCount} of ${ordered.length} done` : 'No checklist items yet'}
      </div>

      {ordered.length > 0 ? (
        <ol className="space-y-1.5">
          {ordered.map((item, index) => {
            const isDone = item.status === 'COMPLETED';
            const isInactive = item.status === 'CANCELLED';
            return (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2 text-sm"
              >
                {canMutate ? (
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item)}
                    disabled={isSubmitting || isInactive}
                    aria-label={isDone ? `Reopen ${item.title}` : `Complete ${item.title}`}
                    className="text-muted-foreground hover:text-emerald-600 disabled:opacity-50"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                ) : isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}

                <div className="min-w-0 flex-1">
                  <span
                    className={
                      isDone
                        ? 'text-muted-foreground line-through'
                        : isInactive
                          ? 'text-muted-foreground'
                          : ''
                    }
                  >
                    {item.title}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.referenceId}
                    {item.status !== 'PLANNED' && item.status !== 'COMPLETED'
                      ? ` · ${mhdFormatSubActivityStatus(item.status)}`
                      : ''}
                    {item.scheduledAt ? ` · ${mhdFormatDateTime(item.scheduledAt)}` : ''}
                  </span>
                  {item.descriptionPlainText ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.descriptionPlainText}
                    </p>
                  ) : null}
                </div>

                {canMutate ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onReorder(item, 'up')}
                      disabled={isSubmitting || index === 0}
                      aria-label={`Move ${item.title} up`}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorder(item, 'down')}
                      disabled={isSubmitting || index === ordered.length - 1}
                      aria-label={`Move ${item.title} down`}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={isSubmitting}
                      aria-label={`Delete ${item.title}`}
                      className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {canMutate ? (
        <Button type="button" className="gap-1 px-3 py-2" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" />
          Add Checklist Item
        </Button>
      ) : null}

      {isAdding && canMutate ? (
        <MhdFormModal
          title="Add Checklist Item"
          description="Add an agenda or action item to this activity."
          size="md"
          onClose={() => setIsAdding(false)}
        >
          <MhdDraftBanner
            draft={draft}
            onRestore={(payload) => setNewTitle(String(payload.title ?? ''))}
          />
          <form className="space-y-4" onSubmit={handleAdd}>
            <div>
              <label htmlFor="mhd-checklist-item-title" className="mb-1 block text-sm font-medium">
                Item
              </label>
              <input
                id="mhd-checklist-item-title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Add agenda / action item…"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting || newTitle.trim().length === 0}>
                Add Item
              </Button>
              <MhdSaveDraftButton
                draft={draft}
                getValues={() => ({ title: newTitle })}
                disabled={newTitle.trim().length === 0}
              />
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </MhdFormModal>
      ) : null}
    </div>
  );
}
