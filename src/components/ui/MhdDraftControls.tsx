import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MhdDraftController } from '@/features/drafts/Hook';
import type { MhdDraftPayload } from '@/features/drafts/Types';

function formatSavedAt(value: string): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

interface MhdDraftBannerProps {
  draft: MhdDraftController;
  /** Put the saved values (and the wizard step, when the draft has one) back into the form. */
  onRestore: (payload: MhdDraftPayload, stepKey: string | null) => void;
}

/**
 * "You have a saved draft" banner with Resume Draft and Start Over. Renders nothing when there is no draft, after
 * the person resumes or starts over, or once they save a new draft on this screen.
 */
export function MhdDraftBanner({ draft, onRestore }: MhdDraftBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const saved = draft.draft;
  if (!saved || dismissed || draft.savedAt !== null) return null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
    >
      <span className="flex-1">You have a saved draft from {formatSavedAt(saved.updatedAt)}.</span>
      <Button
        type="button"
        onClick={() => {
          onRestore(saved.payload, saved.stepKey);
          setDismissed(true);
        }}
      >
        Resume Draft
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void draft.discard().then(() => setDismissed(true));
        }}
      >
        Start Over
      </Button>
    </div>
  );
}

interface MhdSaveDraftButtonProps {
  draft: MhdDraftController;
  /** Called when the button is pressed, so the draft holds the form's values at that moment. Must not include diagnosis or medical detail. */
  getValues: () => MhdDraftPayload;
  /** The wizard step the person is on, so Resume can reopen it. */
  stepKey?: string | null;
  title?: string;
  disabled?: boolean;
}

/** Save Draft button for a form's action row, with the saved/failed status beside it. */
export function MhdSaveDraftButton({ draft, getValues, stepKey = null, title, disabled }: MhdSaveDraftButtonProps) {
  async function handleSave() {
    try {
      await draft.save({ payload: getValues(), stepKey, title });
    } catch {
      // draft.saveError carries the failure to the message below; the form values stay untouched.
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="gap-1.5"
        disabled={disabled || draft.isSaving}
        onClick={() => void handleSave()}
      >
        <Save className="h-4 w-4" aria-hidden />
        {draft.isSaving ? 'Saving Draft...' : 'Save Draft'}
      </Button>
      {draft.savedAt ? (
        <span role="status" className="text-sm text-muted-foreground">
          Draft saved {formatSavedAt(draft.savedAt)}. You can close this window and resume later.
        </span>
      ) : null}
      {draft.saveError ? (
        <span role="alert" className="text-sm text-red-700">
          {draft.saveError}
        </span>
      ) : null}
    </>
  );
}
