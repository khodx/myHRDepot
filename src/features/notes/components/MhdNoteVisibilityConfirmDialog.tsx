import { Button } from '@/components/ui/Button';
import { MhdModal } from '@/components/ui/MhdModal';
import { MHD_NOTE_VISIBILITY_COPY, type MhdNoteVisibility } from '../Types';

interface MhdNoteVisibilityConfirmDialogProps {
  visibility: MhdNoteVisibility;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Pre-submit confirmation so a note author cannot post without seeing exactly
 * who can read the tier they picked. "Cancel" returns to the composer with
 * the draft and visibility selector intact so they can pick a different
 * tier instead of losing their note text.
 */
export function MhdNoteVisibilityConfirmDialog({
  visibility,
  isSaving,
  onCancel,
  onConfirm,
}: MhdNoteVisibilityConfirmDialogProps) {
  const copy = MHD_NOTE_VISIBILITY_COPY[visibility];

  return (
    <MhdModal onClose={onCancel} title="Confirm note visibility" className="w-full max-w-md rounded-lg border border-border bg-background shadow-xl">
      <h2 className="text-base font-semibold text-foreground">Confirm note visibility</h2>
      <p className="mt-2 text-sm text-foreground">
        This note will post to the <span className="font-semibold">{copy.label}</span> field.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel and post to a different Note field/table
        </Button>
        <Button type="button" onClick={onConfirm} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'I understand and proceed'}
        </Button>
      </div>
    </MhdModal>
  );
}
