import { useState, type FormEvent } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdRichTextEditor, MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import {
  mhdDocumentToRichHtml,
  mhdPlainTextToRichHtml,
  mhdRichTextToDocument,
} from '@/components/ui/MhdRichTextUtils';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdNotes } from '@/features/notes/Hook';
import { type MhdNote, type MhdNoteVisibility } from '@/features/notes/Types';
import { mhdFormatDateTime } from '@/utils/mhdDateFormat';

interface Props {
  activityId: string;
  readOnly?: boolean;
}

function MhdActivityNoteEditor({
  initialText = '',
  initialRichText,
  initialVisibility = 'PUBLIC',
  isSaving,
  onSave,
  onCancel,
}: {
  initialText?: string;
  initialRichText?: unknown;
  initialVisibility?: MhdNoteVisibility;
  isSaving: boolean;
  onSave: (
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) => Promise<void>;
  onCancel?: () => void;
}) {
  const [notePlainText, setNotePlainText] = useState(initialText);
  const [noteHtml, setNoteHtml] = useState(
    initialRichText
      ? mhdDocumentToRichHtml(initialRichText, initialText)
      : mhdPlainTextToRichHtml(initialText),
  );
  const [noteRichText, setNoteRichText] = useState<unknown>(initialRichText ?? null);
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
    await onSave(
      noteRichText ?? mhdRichTextToDocument(noteHtml || mhdPlainTextToRichHtml(trimmed), trimmed),
      trimmed,
      visibility,
    );
    if (!onCancel) {
      setNotePlainText('');
      setNoteHtml('');
      setNoteRichText(null);
      setVisibility('PUBLIC');
    }
  }

  return (
    <form
      className="space-y-3 rounded-md border border-border bg-muted p-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div>
        <MhdRichTextEditor
          label="Note"
          html={noteHtml}
          onChange={(html, plainText, document) => {
            setNoteHtml(html);
            setNotePlainText(plainText);
            setNoteRichText(document);
          }}
          minHeightClassName="min-h-28"
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
  isReply = false,
  onUpdate,
  onDelete,
  onReply,
}: {
  note: MhdNote;
  isSaving: boolean;
  readOnly: boolean;
  isReply?: boolean;
  onUpdate: (
    noteId: string,
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  /** Omit (or leave undefined on a reply) to disable the Reply action. */
  onReply?: (
    parentNoteId: string,
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  if (isEditing) {
    return (
      <MhdActivityNoteEditor
        initialText={note.notePlainText}
        initialRichText={note.noteRichText}
        initialVisibility={note.visibility}
        isSaving={isSaving}
        onSave={async (noteRichText, notePlainText, visibility) => {
          await onUpdate(note.id, noteRichText, notePlainText, visibility);
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
            {note.visibility} • {mhdFormatDateTime(note.createdAt)}
          </p>
        </div>

        {!readOnly ? (
          <div className="flex gap-2">
            {!isReply && onReply && !isReplying ? (
              <Button
                variant="secondary"
                className="px-3 py-1.5"
                onClick={() => setIsReplying(true)}
              >
                Reply
              </Button>
            ) : null}
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

      <MhdRichTextRenderer
        html={mhdDocumentToRichHtml(note.noteRichText, note.notePlainText)}
        className="mt-3 text-foreground"
      />

      {!isReply && onReply && isReplying ? (
        <div className="mt-3">
          <MhdActivityNoteEditor
            isSaving={isSaving}
            onSave={async (noteRichText, notePlainText, visibility) => {
              await onReply(note.id, noteRichText, notePlainText, visibility);
              setIsReplying(false);
            }}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      ) : null}
    </MhdCard>
  );
}

export function MhdActivityNotesPanel({ activityId, readOnly = false }: Props) {
  const { profile } = useMhdAuth();
  const notesState = useMhdNotes('ACTIVITY', activityId, Boolean(profile?.userId));

  async function handleCreate(
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) {
    await notesState.createNote(noteRichText, notePlainText, visibility);
  }

  async function handleReply(
    parentNoteId: string,
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) {
    await notesState.createNote(noteRichText, notePlainText, visibility, parentNoteId);
  }

  async function handleUpdate(
    noteId: string,
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) {
    try {
      await notesState.updateNote(noteId, noteRichText, notePlainText, visibility);
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

  const topLevelNotes = notesState.notes.filter((note) => !note.parentNoteId);
  const repliesByParent = new Map<string, MhdNote[]>();
  for (const note of notesState.notes) {
    if (!note.parentNoteId) continue;
    const siblings = repliesByParent.get(note.parentNoteId) ?? [];
    siblings.push(note);
    repliesByParent.set(note.parentNoteId, siblings);
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
          <MhdCard className="border border-dashed border-border">
            <MhdEmptyState icon={MessageSquare} title="No notes yet." />
          </MhdCard>
        ) : null}
        <div className="space-y-3">
          {topLevelNotes.map((note) => {
            const replies = repliesByParent.get(note.id) ?? [];
            return (
              <div key={note.id} className="space-y-3">
                <MhdActivityNoteItem
                  note={note}
                  isSaving={notesState.isSaving}
                  readOnly={readOnly}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onReply={readOnly ? undefined : handleReply}
                />
                {replies.length > 0 && (
                  <div className="ml-8 space-y-3 border-l-2 border-border pl-4">
                    {replies.map((reply) => (
                      <MhdActivityNoteItem
                        key={reply.id}
                        note={reply}
                        isReply
                        isSaving={notesState.isSaving}
                        readOnly={readOnly}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
