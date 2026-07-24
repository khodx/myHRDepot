import { useState, type FormEvent } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdNotes } from '@/features/notes/Hook';
import {
  mhdPlainTextToRichText,
  type MhdNote,
  type MhdNoteVisibility,
} from '@/features/notes/Types';

interface Props {
  activityId: string;
  readOnly?: boolean;
}

function MhdActivityNoteEditor({
  initialText = '',
  initialVisibility = 'PUBLIC',
  isSaving,
  onSave,
  onCancel,
}: {
  initialText?: string;
  initialVisibility?: MhdNoteVisibility;
  isSaving: boolean;
  onSave: (notePlainText: string, visibility: MhdNoteVisibility) => Promise<void>;
  onCancel?: () => void;
}) {
  const [notePlainText, setNotePlainText] = useState(initialText);
  const [visibility, setVisibility] = useState<MhdNoteVisibility>(initialVisibility);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = notePlainText.trim();
    if (!trimmed) {
      setLocalError('Note text is required.');
      return;
    }

    setLocalError(null);
    await onSave(trimmed, visibility);
    if (!onCancel) {
      setNotePlainText('');
      setVisibility('PUBLIC');
    }
  }

  return (
    <form
      className="space-y-3 rounded-md border border-border bg-muted p-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Note</label>
        <textarea
          value={notePlainText}
          onChange={(event) => setNotePlainText(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="Add a note to this activity…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">
          <span className="mr-2 font-medium text-foreground">Visibility</span>
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as MhdNoteVisibility)}
            className="rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="PUBLIC">Public</option>
            <option value="ADMIN">Admin</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Note'}
        </Button>

        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>

      {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
    </form>
  );
}

function MhdActivityNoteItem({
  note,
  isSaving,
  readOnly,
  onUpdate,
  onDelete,
}: {
  note: MhdNote;
  isSaving: boolean;
  readOnly: boolean;
  onUpdate: (noteId: string, notePlainText: string, visibility: MhdNoteVisibility) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <MhdActivityNoteEditor
        initialText={note.notePlainText}
        initialVisibility={note.visibility}
        isSaving={isSaving}
        onSave={async (notePlainText, visibility) => {
          await onUpdate(note.id, notePlainText, visibility);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <MhdCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {note.createdByDisplayName ?? 'Unknown author'}
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {note.visibility} • {new Date(note.createdAt).toLocaleString()}
          </p>
        </div>

        {!readOnly && (note.canEdit || note.canDelete) ? (
          <div className="flex gap-2">
            {note.canEdit ? (
              <Button
                variant="secondary"
                className="px-3 py-1.5"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            ) : null}
            {note.canDelete ? (
              <button
                type="button"
                onClick={() => void onDelete(note.id)}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700"
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{note.notePlainText}</p>
    </MhdCard>
  );
}

export function MhdActivityNotesPanel({ activityId, readOnly = false }: Props) {
  const { profile } = useMhdAuth();
  const notesState = useMhdNotes('ACTIVITY', activityId, Boolean(profile?.userId));

  async function handleCreate(notePlainText: string, visibility: MhdNoteVisibility) {
    await notesState.createNote(mhdPlainTextToRichText(notePlainText), notePlainText, visibility);
  }

  async function handleUpdate(
    noteId: string,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) {
    try {
      await notesState.updateNote(
        noteId,
        mhdPlainTextToRichText(notePlainText),
        notePlainText,
        visibility,
      );
    } catch {
      // Surfaced through notesState.errorMessage.
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await notesState.deleteNote(noteId);
    } catch {
      // Surfaced through notesState.errorMessage.
    }
  }

  return (
    <div className="space-y-4">
      {notesState.errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {notesState.errorMessage}
        </div>
      ) : null}

      {readOnly ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          You have read-only access to activity notes.
        </div>
      ) : (
        <MhdActivityNoteEditor isSaving={notesState.isSaving} onSave={handleCreate} />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Comments Timeline</h2>
          <button
            className="text-sm font-semibold text-accent hover:text-accent-hover"
            onClick={() => void notesState.refresh()}
          >
            Refresh
          </button>
        </div>

        {notesState.isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading notes…</div>
        ) : null}
        {!notesState.isLoading && notesState.notes.length === 0 ? (
          <MhdCard className="border-dashed">
            <MhdEmptyState icon={MessageSquare} title="No notes yet." />
          </MhdCard>
        ) : null}
        <div className="space-y-3">
          {notesState.notes.map((note) => (
            <MhdActivityNoteItem
              key={note.id}
              note={note}
              isSaving={notesState.isSaving}
              readOnly={readOnly}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
