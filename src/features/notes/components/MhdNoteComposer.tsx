import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
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
    <form className="rounded-xl border border-border bg-card p-4 shadow-sm" onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Add Note</h2>
          <p className="text-sm text-muted-foreground">Capture comments, updates, and internal context for this task.</p>
        </div>
        <select
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as MhdNoteVisibility)}
        >
          <option value="PUBLIC">Public</option>
          <option value="ADMIN">Admin</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>
      <textarea
        className="mt-4 min-h-32 w-full rounded-md border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={notePlainText}
        onChange={(event) => setNotePlainText(event.target.value)}
        placeholder="Type the task note or comment here..."
      />
      {localError && <p className="mt-2 text-sm text-red-600">{localError}</p>}
      <div className="mt-4 flex justify-end">
        <Button className="font-semibold" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
    </form>
  );
}
