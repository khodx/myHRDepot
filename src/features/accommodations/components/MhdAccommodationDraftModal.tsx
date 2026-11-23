import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, type MhdDraftKind, type MhdDraftPayload } from '@/features/drafts/Types';

/** Shown in every accommodation modal whose form carries medical fields that are left out of the draft. */
export const MHD_ACCOMMODATION_MEDICAL_DRAFT_NOTICE = 'Medical details are not saved in drafts.';

interface MhdAccommodationDraftModalProps {
  title: string;
  description?: string;
  size?: 'md' | 'lg' | 'xl';
  /** Defaults to the case-action kind; the option library passes its own. */
  draftKind?: MhdDraftKind;
  /** The record the form acts on, suffixed when one record has several action forms (`${caseId}:decision`). */
  draftKey: string;
  companyId: string | null;
  /** Title stored with the draft so a drafts list can name it. */
  draftTitle?: string;
  /**
   * The form's NON-MEDICAL values. Functional limitations, accommodation need, provider certification
   * content and anything diagnosis-adjacent never go into a draft; the server also refuses diagnosis
   * terms (23514).
   */
  getDraftValues: () => MhdDraftPayload;
  onRestore: (payload: MhdDraftPayload) => void;
  /** The form has medical fields that the draft leaves out; says so under the heading. */
  excludesMedical?: boolean;
  submitLabel: string;
  pendingLabel?: string;
  submitDisabled?: boolean;
  submitVariant?: 'primary' | 'destructive';
  isSubmitting: boolean;
  /**
   * Runs the action. Throw to keep the modal open with the message; resolve `false` when client
   * validation stopped it (the form shows its own messages). Any other result closes the modal and
   * removes the draft.
   */
  onSubmit: () => Promise<unknown>;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The one modal every accommodation input form opens in: heading, resume banner, the form body,
 * and an action row of submit, Save Draft and Cancel. The draft is loaded only while the modal is
 * mounted, and removed once the action succeeds.
 */
export function MhdAccommodationDraftModal({
  title,
  description,
  size = 'lg',
  draftKind = MHD_DRAFT_KINDS.accommodationCaseAction,
  draftKey,
  companyId,
  draftTitle,
  getDraftValues,
  onRestore,
  excludesMedical = false,
  submitLabel,
  pendingLabel,
  submitDisabled = false,
  submitVariant = 'primary',
  isSubmitting,
  onSubmit,
  onClose,
  children,
}: MhdAccommodationDraftModalProps) {
  const draft = useMhdDraft({ draftKind, draftKey, companyId, enabled: true });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      const result = await onSubmit();
      if (result === false) return;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
      return;
    }
    try {
      await draft.discard();
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : 'unknown error';
      setError(`Saved. The saved draft could not be removed: ${reason}`);
      return;
    }
    onClose();
  }

  return (
    <MhdFormModal title={title} description={description} size={size} onClose={onClose}>
      <div className="space-y-3">
        {excludesMedical ? (
          <p className="text-xs text-muted-foreground">{MHD_ACCOMMODATION_MEDICAL_DRAFT_NOTICE}</p>
        ) : null}
        <MhdDraftBanner draft={draft} onRestore={(payload) => onRestore(payload)} />
        {children}
        {error ? (
          <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            variant={submitVariant}
            disabled={isSubmitting || submitDisabled}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting && pendingLabel ? pendingLabel : submitLabel}
          </Button>
          <MhdSaveDraftButton
            draft={draft}
            getValues={getDraftValues}
            title={draftTitle ?? title}
          />
          <Button variant="secondary" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </MhdFormModal>
  );
}
