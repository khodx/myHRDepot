import { useState, type FormEvent } from 'react';
import type { MhdNoteVisibility } from '../Types';

interface MhdNoteComposerProps {
  isSaving: boolean;
  onCreate: (notePlainText: string, visibility: MhdNoteVisibility) => Promise<void>;
}

export function MhdNoteComposer({ isSaving, onCreate }: MhdNoteComposerProps) {
  const [notePlainText, setNotePlainText] = useState('');
  const [visibility, setVisibility] = useState<MhdNoteVisibility>('PUBLIC');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNote = notePlainText.trim();
    if (!trimmedNote) {
      setLocalError('Enter a note before saving.');
      return;
    }
    setLocalError(null);
    try {
      await onCreate(trimmedNote, visibility);
      setNotePlainText('');
      setVisibility('PUBLIC');
    } catch (error) {
      // The hook surfaces the failure via its own errorMessage; keep the draft text so the
      // user can retry without retyping.
      setLocalError(error instanceof Error ? error.message : 'Unable to save note.');
    }
  }

  return (
    <form className="rounded-xl border border-slate-200 bg-card p-4 shadow-sm" onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add Note</h2>
          <p className="text-sm text-slate-600">Capture comments, updates, and internal context for this task.</p>
        </div>
        <select
          className="rounded-md border border-slate-300 bg-card px-3 py-2 text-sm"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as MhdNoteVisibility)}
        >
          <option value="PUBLIC">Public</option>
          <option value="ADMIN">Admin</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>
      <textarea
        className="mt-4 min-h-32 w-full rounded-md border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={notePlainText}
        onChange={(event) => setNotePlainText(event.target.value)}
        placeholder="Type the task note or comment here..."
      />
      {localError && <p className="mt-2 text-sm text-red-600">{localError}</p>}
      <div className="mt-4 flex justify-end">
        <button
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </form>
  );
}
