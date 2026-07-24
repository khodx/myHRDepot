import { useCallback, useEffect, useMemo, useState } from 'react';
import { mhdCreateNote, mhdDeleteNote, mhdListNotesForEntity, mhdUpdateNote } from './Service';
import type { MhdCreateNoteInput, MhdNote, MhdNoteEntityType, MhdNoteVisibility } from './Types';

// Actor identity is resolved server-side from the Supabase session inside each RPC
// (`mhd_current_user_id()`), so this hook does not thread an `actorUserId` through every call --
// it only needs to know whether the caller is authenticated (`isAuthenticated`) to gate the
// mutation actions in the UI.
//
// Task/subtask header context (title, reference_id, company_name, etc.) is a 03.4 Tasks-module
// concern and is out of scope for this hook. Compose the Tasks module's task query alongside
// this hook if a notes panel needs both.

export function useMhdNotes(
  entityType: MhdNoteEntityType,
  entityId: string | undefined,
  isAuthenticated: boolean,
) {
  const [notes, setNotes] = useState<MhdNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const noteRows = await mhdListNotesForEntity(entityType, entityId);
      setNotes(noteRows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load notes.');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: fetch-on-mount with loading state
    void loadNotes();
  }, [loadNotes]);

  const createNote = useCallback(
    async (noteRichText: unknown, notePlainText: string, visibility: MhdNoteVisibility) => {
      if (!entityId) throw new Error('Entity ID is required to create a note.');
      if (!isAuthenticated) throw new Error('Authenticated actor is required to create a note.');
      setIsSaving(true);
      setErrorMessage(null);
      try {
        const input: MhdCreateNoteInput = {
          entityType,
          entityId,
          noteRichText,
          notePlainText,
          visibility,
        };
        await mhdCreateNote(input);
        await loadNotes();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create note.';
        setErrorMessage(message);
        throw new Error(message, { cause: error });
      } finally {
        setIsSaving(false);
      }
    },
    [entityId, entityType, isAuthenticated, loadNotes],
  );

  const updateNote = useCallback(
    async (
      noteId: string,
      noteRichText: unknown,
      notePlainText: string,
      visibility?: MhdNoteVisibility,
    ) => {
      if (!isAuthenticated) throw new Error('Authenticated actor is required to update a note.');
      setIsSaving(true);
      setErrorMessage(null);
      try {
        await mhdUpdateNote({ noteId, noteRichText, notePlainText, visibility });
        await loadNotes();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update note.';
        setErrorMessage(message);
        throw new Error(message, { cause: error });
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, loadNotes],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!isAuthenticated) throw new Error('Authenticated actor is required to delete a note.');
      setIsSaving(true);
      setErrorMessage(null);
      try {
        await mhdDeleteNote(noteId);
        await loadNotes();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete note.';
        setErrorMessage(message);
        throw new Error(message, { cause: error });
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, loadNotes],
  );

  const noteCount = useMemo(() => notes.length, [notes.length]);

  return {
    notes,
    noteCount,
    isLoading,
    isSaving,
    errorMessage,
    refresh: loadNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
