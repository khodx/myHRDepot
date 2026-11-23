import { useState, type FormEvent } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { MhdRichTextEditor, MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import {
  mhdDocumentToRichHtml,
  mhdPlainTextToRichHtml,
  mhdRichTextToDocument,
} from '@/components/ui/MhdRichTextUtils';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDraft, type MhdDraftController } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS } from '@/features/drafts/Types';
import { useMhdNotes } from '@/features/notes/Hook';
import {
  MHD_NOTE_VISIBILITY_COPY,
  type MhdNote,
  type MhdNoteVisibility,
} from '@/features/notes/Types';
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
  draft,
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
  draft?: MhdDraftController;
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

  function getDraftValues() {
    return { noteRichText, notePlainText, visibility };
  }

  function restoreDraft(payload: Record<string, unknown>) {
    const plainText = typeof payload.notePlainText === 'string' ? payload.notePlainText : '';
    const document = payload.noteRichText ?? null;
    setNotePlainText(plainText);
    setNoteRichText(document);
    setNoteHtml(
      document ? mhdDocumentToRichHtml(document, plainText) : mhdPlainTextToRichHtml(plainText),
    );
    if (typeof payload.visibility === 'string' && payload.visibility in MHD_NOTE_VISIBILITY_COPY) {
      setVisibility(payload.visibility as MhdNoteVisibility);
    }
  }

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
  }

  return (
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      {draft ? <MhdDraftBanner draft={draft} onRestore={restoreDraft} /> : null}
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
            {(Object.keys(MHD_NOTE_VISIBILITY_COPY) as MhdNoteVisibility[]).map((tier) => (
              <option key={tier} value={tier}>
                {MHD_NOTE_VISIBILITY_COPY[tier].label}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Note'}
        </Button>

        {draft ? (
          <MhdSaveDraftButton
            draft={draft}
            getValues={getDraftValues}
            disabled={!notePlainText.trim()}
          />
        ) : null}

        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Medical details are not saved in drafts.</p>

      {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
    </form>
  );
}

function MhdActivityNoteModal({
  title,
  draftKey,
  initialText,
  initialRichText,
  initialVisibility,
  isSaving,
  onSave,
  onClose,
}: {
  title: string;
  draftKey: string;
  initialText?: string;
  initialRichText?: unknown;
  initialVisibility?: MhdNoteVisibility;
  isSaving: boolean;
  onSave: (
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) => Promise<void>;
  onClose: () => void;
}) {
  // Mounted only while open, so the draft loads when the modal opens.
  const draft = useMhdDraft({ draftKind: MHD_DRAFT_KINDS.activityNote, draftKey });
  return (
    <MhdFormModal title={title} onClose={onClose}>
      <MhdActivityNoteEditor
        initialText={initialText}
        initialRichText={initialRichText}
        initialVisibility={initialVisibility}
        isSaving={isSaving}
        draft={draft}
        onSave={async (noteRichText, notePlainText, visibility) => {
          await onSave(noteRichText, notePlainText, visibility);
          await draft.discard();
          onClose();
        }}
        onCancel={onClose}
      />
    </MhdFormModal>
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

      {isEditing ? (
        <MhdActivityNoteModal
          title="Edit Note"
          draftKey={note.id}
          initialText={note.notePlainText}
          initialRichText={note.noteRichText}
          initialVisibility={note.visibility}
          isSaving={isSaving}
          onSave={(noteRichText, notePlainText, visibility) =>
            onUpdate(note.id, noteRichText, notePlainText, visibility)
          }
          onClose={() => setIsEditing(false)}
        />
      ) : null}

      {!isReply && onReply && isReplying ? (
        <MhdActivityNoteModal
          title="Reply To Note"
          draftKey={`${note.id}:reply`}
          isSaving={isSaving}
          onSave={(noteRichText, notePlainText, visibility) =>
            onReply(note.id, noteRichText, notePlainText, visibility)
          }
          onClose={() => setIsReplying(false)}
        />
      ) : null}
    </MhdCard>
  );
}

export function MhdActivityNotesPanel({ activityId, readOnly = false }: Props) {
  const { profile } = useMhdAuth();
  const notesState = useMhdNotes('ACTIVITY', activityId, Boolean(profile?.userId));
  const [isAddingNote, setIsAddingNote] = useState(false);

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
        <Button type="button" className="gap-1.5" onClick={() => setIsAddingNote(true)}>
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      )}

      {isAddingNote && !readOnly ? (
        <MhdActivityNoteModal
          title="Add Note"
          draftKey={`${activityId}:new`}
          isSaving={notesState.isSaving}
          onSave={handleCreate}
          onClose={() => setIsAddingNote(false)}
        />
      ) : null}

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
