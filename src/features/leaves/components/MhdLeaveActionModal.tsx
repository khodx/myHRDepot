import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import type { ButtonVariant } from '@/components/ui/buttonStyles';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, type MhdDraftPayload } from '@/features/drafts/Types';
import {
  MhdLeaveActionContext,
  useMhdLeaveAction,
  type MhdLeaveActionContextValue,
  type MhdLeaveDraftFieldEntry,
} from './mhdLeaveActionContext';

export const MHD_LEAVE_MEDICAL_DRAFT_NOTICE = 'Medical details are not saved in drafts.';

interface MhdLeaveActionModalProps {
  caseId: string;
  /** Names the action within the case; the draft key is `${caseId}:${action}`. */
  action: string;
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
  /** False for an action whose every field is medical-tier: no draft is kept at all. */
  draftable?: boolean;
  /** Shows the "not saved in drafts" line for a modal that holds medical-tier fields. */
  medicalFields?: boolean;
  children: ReactNode;
}

/**
 * The one modal every add / record / edit action on a leave case opens in. It owns the open
 * state, the server-side draft (kind LEAVE_CASE_ACTION) and the save runner, and hands them to
 * the form inside through MhdLeaveActionContext: fields declared with useMhdLeaveDraftField are
 * what Save Draft keeps and Resume Draft restores, and MhdLeaveActionButtons is the action row.
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
  companyId,
  title,
  description,
  size = 'lg',
  draftable = true,
  medicalFields = false,
  onClose,
  children,
}: Omit<
  MhdLeaveActionModalProps,
  'launchLabel' | 'launchVariant' | 'launchDisabled' | 'open' | 'onOpenChange'
> & {
  onClose: () => void;
}) {
  const draft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.leaveCaseAction,
    draftKey: `${caseId}:${action}`,
    companyId,
    enabled: draftable,
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

  const controller = draftable ? draft : null;

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
        if (controller) await controller.discard();
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
    [controller, onClose],
  );

  const context = useMemo<MhdLeaveActionContextValue>(
    () => ({
      title,
      draft: controller,
      registerField,
      getDraftValues,
      submit,
      isSubmitting,
      close: onClose,
    }),
    [title, controller, registerField, getDraftValues, submit, isSubmitting, onClose],
  );

  return (
    <MhdFormModal title={title} description={description} size={size} onClose={onClose}>
      <MhdLeaveActionContext.Provider value={context}>
        {controller ? (
          <MhdDraftBanner draft={controller} onRestore={(payload) => restore(payload)} />
        ) : null}
        {medicalFields || !draftable ? (
          <p className="mb-3 text-xs text-muted-foreground">{MHD_LEAVE_MEDICAL_DRAFT_NOTICE}</p>
        ) : null}
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

/** The action row of a leave action form: submit, Save Draft (when the modal keeps one) and Cancel. */
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
      {draft ? <MhdSaveDraftButton draft={draft} getValues={getDraftValues} title={title} /> : null}
      <Button variant="secondary" onClick={close}>
        Cancel
      </Button>
    </div>
  );
}
