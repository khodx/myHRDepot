import { useMhdAuth } from '@/features/authentication/Hook';
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

  async function handleCreate(
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) {
    await notesState.createNote(noteRichText, notePlainText, visibility);
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

      <MhdNoteComposer isSaving={notesState.isSaving} onCreate={handleCreate} />

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
        />
      </section>
    </div>
  );
}
