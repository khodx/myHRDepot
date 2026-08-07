import { ArrowDown, ArrowUp, CheckCircle2, Circle, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { MhdSubActivity } from '../Types';
import { mhdFormatSubActivityStatus } from '../Types';
import { mhdFormatDateTime } from '@/utils/mhdDateFormat';

interface Props {
  subActivities: MhdSubActivity[];
  canMutate: boolean;
  isSubmitting: boolean;
  onToggleComplete: (subActivity: MhdSubActivity) => void;
  onAdd: (title: string) => Promise<void>;
  onDelete: (subActivity: MhdSubActivity) => void;
  onReorder: (subActivity: MhdSubActivity, direction: 'up' | 'down') => void;
}

export function MhdSubActivityChecklist({
  subActivities,
  canMutate,
  isSubmitting,
  onToggleComplete,
  onAdd,
  onDelete,
  onReorder,
}: Props) {
  const [newTitle, setNewTitle] = useState('');

  const ordered = [...subActivities].sort((a, b) => a.sortOrder - b.sortOrder);
  const doneCount = ordered.filter((item) => item.status === 'COMPLETED').length;

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    await onAdd(title);
    setNewTitle('');
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
        <form className="flex items-center gap-2" onSubmit={handleAdd}>
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Add agenda / action item…"
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <Button
            type="submit"
            disabled={isSubmitting || newTitle.trim().length === 0}
            className="gap-1 px-3 py-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      ) : null}
    </div>
  );
}
