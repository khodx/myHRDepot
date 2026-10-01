import { useCallback, useState } from 'react';

/**
 * Runs an async action and keeps its failure on screen instead of letting it become
 * an unhandled promise rejection. Resolves `true` when the action succeeded, so a
 * caller can close its dialog only on success.
 *
 * The server's own message is surfaced when there is one - for the RPC-backed
 * modules those messages are deliberate (for example "Occurrence … is voided and
 * cannot be reclassified") and are what the person needs to read. `fallback` is used
 * only when the thrown value carries no message.
 */
export function useMhdActionRunner() {
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>, fallback: string): Promise<boolean> => {
      setError(null);
      try {
        await action();
        return true;
      } catch (caught) {
        setError(caught instanceof Error && caught.message ? caught.message : fallback);
        return false;
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { error, run, clearError };
}
