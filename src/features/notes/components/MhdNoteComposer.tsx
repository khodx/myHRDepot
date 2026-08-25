import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdPlainTextToRichHtml, mhdRichTextToDocument } from '@/components/ui/MhdRichTextUtils';
import { MHD_NOTE_VISIBILITY_COPY, type MhdNoteVisibility } from '../Types';
import { MhdNoteVisibilityConfirmDialog } from './MhdNoteVisibilityConfirmDialog';

interface MhdNoteComposerProps {
  isSaving: boolean;
  onCreate: (
    noteRichText: unknown,
    notePlainText: string,
    visibility: MhdNoteVisibility,
  ) => Promise<void>;
}

export function MhdNoteComposer({ isSaving, onCreate }: MhdNoteComposerProps) {
  const [notePlainText, setNotePlainText] = useState('');
  const [noteHtml, setNoteHtml] = useState('');
  const [noteRichText, setNoteRichText] = useState<unknown>(null);
  const [visibility, setVisibility] = useState<MhdNoteVisibility>('PUBLIC');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNote = notePlainText.trim();
    if (!trimmedNote) {
      setLocalError('Enter a note before saving.');
      return;
    }
    setLocalError(null);
    setShowVisibilityConfirm(true);
  }

  async function handleConfirmedCreate() {
    const trimmedNote = notePlainText.trim();
    try {
      await onCreate(
        noteRichText ??
          mhdRichTextToDocument(noteHtml || mhdPlainTextToRichHtml(trimmedNote), trimmedNote),
        trimmedNote,
        visibility,
      );
      setShowVisibilityConfirm(false);
      setNotePlainText('');
      setNoteHtml('');
      setNoteRichText(null);
      setVisibility('PUBLIC');
    } catch (error) {
      // The hook surfaces the failure via its own errorMessage; keep the draft text (and the
      // dialog closed) so the user can see the error and retry without retyping.
      setShowVisibilityConfirm(false);
      setLocalError(error instanceof Error ? error.message : 'Unable to save note.');
    }
  }

  return (
    <form
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Add Note</h2>
          <p className="text-sm text-muted-foreground">
            Capture comments, updates, and internal context for this task.
          </p>
        </div>
        <div className="text-right">
          <select
            aria-label="Note visibility"
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as MhdNoteVisibility)}
          >
            {(Object.keys(MHD_NOTE_VISIBILITY_COPY) as MhdNoteVisibility[]).map((tier) => (
              <option key={tier} value={tier}>
                {MHD_NOTE_VISIBILITY_COPY[tier].label}
              </option>
            ))}
          </select>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {MHD_NOTE_VISIBILITY_COPY[visibility].description}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <MhdRichTextEditor
          label="Note"
          html={noteHtml || mhdPlainTextToRichHtml(notePlainText)}
          onChange={(html, plainText, document) => {
            setNoteHtml(html);
            setNotePlainText(plainText);
            setNoteRichText(document);
          }}
          minHeightClassName="min-h-32"
          placeholder="Type the task note or comment here..."
        />
      </div>
      {localError && <p className="mt-2 text-sm text-red-600">{localError}</p>}
      <div className="mt-4 flex justify-end">
        <Button className="font-semibold" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
      {showVisibilityConfirm && (
        <MhdNoteVisibilityConfirmDialog
          visibility={visibility}
          isSaving={isSaving}
          onCancel={() => setShowVisibilityConfirm(false)}
          onConfirm={() => void handleConfirmedCreate()}
        />
      )}
    </form>
  );
}
