import { useState } from 'react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdModal } from '@/components/ui/MhdModal';
import { Button } from '@/components/ui/Button';
import { MhdNoteComposer } from './MhdNoteComposer';
import { MhdNoteList } from './MhdNoteList';
import { useMhdNotes } from '../Hook';
import type { MhdNoteVisibility } from '../Types';

interface MhdTaskNotesPanelProps {
  taskId: string;
}

/**
 * Polymorphic notes panel bound to a TASK entity. Embedded on the task detail
 * page and reused by the routed MhdTaskNotesPage.
 *
 * The composer/list emit both rich-text JSON and searchable plain text, matching
 * the RT-001 companion-column contract on notes.
 */
export function MhdTaskNotesPanel({ taskId }: MhdTaskNotesPanelProps) {
  const { profile } = useMhdAuth();
  const notesState = useMhdNotes('TASK', taskId, Boolean(profile?.userId));
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  async function handleCreate(
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) {
    await notesState.createNote(noteRichText, notePlainText, visibility);
    setIsComposerOpen(false);
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
      // Surfaced via notesState.errorMessage.
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await notesState.deleteNote(noteId);
    } catch {
      // Surfaced via notesState.errorMessage.
    }
  }

  return (
    <div className="space-y-4">
      {notesState.errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {notesState.errorMessage}
        </div>
      )}

      <div className="flex justify-start">
        <Button type="button" onClick={() => setIsComposerOpen(true)}>
          Add Note
        </Button>
      </div>

      {isComposerOpen && (
        <MhdModal onClose={() => setIsComposerOpen(false)} title="Add Note">
          <MhdNoteComposer isSaving={notesState.isSaving} onCreate={handleCreate} />
        </MhdModal>
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
        <MhdNoteList
          notes={notesState.notes}
          isLoading={notesState.isLoading}
          isSaving={notesState.isSaving}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      </section>
    </div>
  );
}
