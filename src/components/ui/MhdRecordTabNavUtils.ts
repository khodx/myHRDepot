import { useState } from 'react';

/**
 * Shared pending/confirm state machine for a RecordTabs trailing
 * destructive/void action (Delete, Close Case, Rescind Case, Cancel Case,
 * Void Request, etc.). Before 2026-08-06 (audit finding M4), 7 RecordTabs
 * components each hand-rolled this identical pending-state + confirm +
 * finally-reset logic.
 */
export function useMhdRecordTabAction(
  action: (() => void | Promise<void>) | undefined,
  options?: { skipConfirm?: boolean; confirmMessage?: string },
) {
  const [pending, setPending] = useState(false);

  async function run() {
    if (!action || pending) return;
    if (
      !options?.skipConfirm &&
      options?.confirmMessage &&
      !window.confirm(options.confirmMessage)
    ) {
      return;
    }
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}
