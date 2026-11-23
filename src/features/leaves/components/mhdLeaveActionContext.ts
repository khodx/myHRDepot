import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { MhdDraftController } from '@/features/drafts/Hook';
import type { MhdDraftPayload } from '@/features/drafts/Types';

export interface MhdLeaveDraftFieldEntry {
  value: unknown;
  restore: (value: unknown) => void;
}

/** What MhdLeaveActionModal hands the form rendered inside it. */
export interface MhdLeaveActionContextValue {
  /** The modal's title, also the saved draft's title. */
  title: string;
  /** Null when the modal keeps no draft (a medical-tier action). */
  draft: MhdDraftController | null;
  registerField: (name: string, entry: MhdLeaveDraftFieldEntry) => () => void;
  getDraftValues: () => MhdDraftPayload;
  /**
   * Runs the save. A rejection is shown verbatim in the modal and the form keeps what was
   * typed; success discards the draft and closes the modal. Resolves whether it saved.
   */
  submit: (action: () => Promise<unknown>) => Promise<boolean>;
  isSubmitting: boolean;
  close: () => void;
}

export const MhdLeaveActionContext = createContext<MhdLeaveActionContextValue | null>(null);

export function useMhdLeaveAction(): MhdLeaveActionContextValue {
  const context = useContext(MhdLeaveActionContext);
  if (!context) throw new Error('A leave action form must be rendered inside MhdLeaveActionModal.');
  return context;
}

/**
 * useState for a leave action form field that Save Draft keeps and Resume Draft restores.
 * A field carrying medical, certification or functional-limitation content must use plain
 * useState instead, so it never reaches the draft payload.
 */
export function useMhdLeaveDraftField<T>(
  name: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  useMhdLeaveDraftBinding(name, value, setValue);
  return [value, setValue];
}

/**
 * Puts a value whose state lives outside the form (a choice the surrounding panel also reads)
 * into the draft, the same way useMhdLeaveDraftField does for the form's own state.
 */
export function useMhdLeaveDraftBinding<T>(name: string, value: T, setValue: (value: T) => void) {
  const { registerField } = useMhdLeaveAction();
  useEffect(
    () => registerField(name, { value, restore: (saved) => setValue(saved as T) }),
    [registerField, name, value, setValue],
  );
}
