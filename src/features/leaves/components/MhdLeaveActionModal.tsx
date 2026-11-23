import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import type { ButtonVariant } from '@/components/ui/buttonStyles';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, type MhdDraftKind, type MhdDraftPayload } from '@/features/drafts/Types';
import {
  MhdLeaveActionContext,
  useMhdLeaveAction,
  type MhdLeaveActionContextValue,
  type MhdLeaveDraftFieldEntry,
} from './mhdLeaveActionContext';

interface MhdLeaveActionModalProps {
  caseId: string;
  /** Names the action within the case; the draft key is `${caseId}:${action}`. */
  action: string;
  /** The draft kind; LEAVE_CASE_ACTION unless the screen has its own kind (the checklist item editor). */
  draftKind?: MhdDraftKind;
  companyId: string | null;
  title: string;
  description?: string;
  size?: 'md' | 'lg' | 'xl';
  /** Renders a launch button with this label. Omit it when the caller opens the modal itself. */
  launchLabel?: string;
  launchVariant?: ButtonVariant;
  launchDisabled?: boolean;
  /** Controlled open state, for a modal launched from more than one place. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

/**
 * The one modal every add / record / edit action on a leave case opens in. It owns the open
 * state, the server-side draft (kind LEAVE_CASE_ACTION) and the save runner, and hands them to
 * the form inside through MhdLeaveActionContext: fields declared with useMhdLeaveDraftField are
 * what Save Draft keeps and Resume Draft restores, and MhdLeaveActionButtons is the action row.
 * Every field of the form is drafted, medical and certification content included.
 */
export function MhdLeaveActionModal({
  launchLabel,
  launchVariant = 'secondary',
  launchDisabled,
  open,
  onOpenChange,
  ...dialog
}: MhdLeaveActionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      {launchLabel ? (
        <Button variant={launchVariant} disabled={launchDisabled} onClick={() => setOpen(true)}>
          {launchLabel}
        </Button>
      ) : null}
      {isOpen ? <MhdLeaveActionDialog {...dialog} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

// Mounted only while open, so every opening starts with a fresh form, error and draft status.
function MhdLeaveActionDialog({
  caseId,
  action,
  draftKind = MHD_DRAFT_KINDS.leaveCaseAction,
  companyId,
  title,
  description,
  size = 'lg',
  onClose,
  children,
}: Omit<
  MhdLeaveActionModalProps,
  'launchLabel' | 'launchVariant' | 'launchDisabled' | 'open' | 'onOpenChange'
> & {
  onClose: () => void;
}) {
  const draft = useMhdDraft({
    draftKind,
    draftKey: `${caseId}:${action}`,
    companyId,
  });
  const fields = useRef(new Map<string, MhdLeaveDraftFieldEntry>());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerField = useCallback((name: string, entry: MhdLeaveDraftFieldEntry) => {
    fields.current.set(name, entry);
    return () => {
      if (fields.current.get(name) === entry) fields.current.delete(name);
    };
  }, []);

  const getDraftValues = useCallback((): MhdDraftPayload => {
    const payload: MhdDraftPayload = {};
    for (const [name, entry] of fields.current) payload[name] = entry.value;
    return payload;
  }, []);

  const restore = useCallback((payload: MhdDraftPayload) => {
    for (const [name, entry] of fields.current) {
      if (payload[name] !== undefined) entry.restore(payload[name]);
    }
  }, []);

  const submit = useCallback(
    async (run: () => Promise<unknown>) => {
      setError(null);
      setIsSubmitting(true);
      try {
        await run();
      } catch (caught) {
        // The server's own refusal is shown verbatim; the form keeps what was typed.
        setError(caught instanceof Error ? caught.message : 'The leave action failed.');
        setIsSubmitting(false);
        return false;
      }
      try {
        await draft.discard();
      } catch (caught) {
        setError(
          `Saved, but the draft could not be removed: ${
            caught instanceof Error ? caught.message : 'unknown error'
          }`,
        );
        setIsSubmitting(false);
        return true;
      }
      setIsSubmitting(false);
      onClose();
      return true;
    },
    [draft, onClose],
  );

  const context = useMemo<MhdLeaveActionContextValue>(
    () => ({
      title,
      draft,
      registerField,
      getDraftValues,
      submit,
      isSubmitting,
      close: onClose,
    }),
    [title, draft, registerField, getDraftValues, submit, isSubmitting, onClose],
  );

  return (
    <MhdFormModal title={title} description={description} size={size} onClose={onClose}>
      <MhdLeaveActionContext.Provider value={context}>
        <MhdDraftBanner draft={draft} onRestore={(payload) => restore(payload)} />
        {error ? (
          <p role="alert" className="mb-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        {children}
      </MhdLeaveActionContext.Provider>
    </MhdFormModal>
  );
}

interface MhdLeaveActionButtonsProps {
  submitLabel: string;
  pendingLabel?: string;
  /** The form's own readiness (required fields, a pending mutation). */
  disabled?: boolean;
  onSubmit: () => Promise<unknown>;
  /** Extra buttons placed after the submit button (a second outcome, for example). */
  children?: ReactNode;
}

/** The action row of a leave action form: submit, Save Draft and Cancel. */
export function MhdLeaveActionButtons({
  submitLabel,
  pendingLabel = 'Saving…',
  disabled,
  onSubmit,
  children,
}: MhdLeaveActionButtonsProps) {
  const { title, draft, getDraftValues, submit, isSubmitting, close } = useMhdLeaveAction();
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button disabled={disabled || isSubmitting} onClick={() => void submit(onSubmit)}>
        {isSubmitting ? pendingLabel : submitLabel}
      </Button>
      {children}
      <MhdSaveDraftButton draft={draft} getValues={getDraftValues} title={title} />
      <Button variant="secondary" onClick={close}>
        Cancel
      </Button>
    </div>
  );
}
