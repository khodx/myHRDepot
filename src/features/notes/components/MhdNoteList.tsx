import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdNoteVisibilityBadge } from './MhdNoteVisibilityBadge';
import type { MhdNote, MhdNoteVisibility } from '../Types';

interface MhdNoteListProps {
  notes: MhdNote[];
  isLoading: boolean;
  isSaving: boolean;
  onUpdate: (noteId: string, notePlainText: string, visibility: MhdNoteVisibility) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export function MhdNoteList({ notes, isLoading, isSaving, onUpdate, onDelete }: MhdNoteListProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftVisibility, setDraftVisibility] = useState<MhdNoteVisibility>('PUBLIC');

  if (isLoading)
    return <MhdCard className="text-sm text-muted-foreground">Loading notes...</MhdCard>;
  if (notes.length === 0) {
    return (
      <MhdCard className="border-dashed">
        <MhdEmptyState
          icon={MessageSquare}
          title="No notes yet"
          description="No notes have been added yet."
        />
      </MhdCard>
    );
  }

  function startEdit(note: MhdNote) {
    setEditingNoteId(note.id);
    setDraftText(note.notePlainText);
    setDraftVisibility(note.visibility);
  }

  async function saveEdit(noteId: string) {
    await onUpdate(noteId, draftText.trim(), draftVisibility);
    setEditingNoteId(null);
    setDraftText('');
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const isEditing = editingNoteId === note.id;
        return (
          <article key={note.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{note.createdByDisplayName}</p>
                  <MhdNoteVisibilityBadge visibility={note.visibility} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.referenceId} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {note.canEdit && !isEditing && (
                  <button
                    className="text-sm font-semibold text-accent hover:text-accent-hover"
                    onClick={() => startEdit(note)}
                  >
                    Edit
                  </button>
                )}
                {note.canDelete && (
                  <button
                    className="text-sm font-semibold text-red-700 hover:text-red-800"
                    disabled={isSaving}
                    onClick={() => void onDelete(note.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <select
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  value={draftVisibility}
                  onChange={(event) => setDraftVisibility(event.target.value as MhdNoteVisibility)}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PRIVATE">Private</option>
                </select>
                <textarea
                  className="min-h-28 w-full rounded-md border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-md border border-border px-3 py-2 text-sm"
                    type="button"
                    onClick={() => setEditingNoteId(null)}
                  >
                    Cancel
                  </button>
                  <Button
                    className="px-3 py-2 font-semibold"
                    disabled={isSaving || !draftText.trim()}
                    type="button"
                    onClick={() => void saveEdit(note.id)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {note.notePlainText}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
