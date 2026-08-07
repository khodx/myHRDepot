import { useEffect } from 'react';

/**
 * Calls `onOutside` on any mousedown outside `ref`'s element. Before
 * 2026-08-06 (audit finding M15), MhdSearchableSelect and
 * MhdMultiSelectCombobox each independently hand-rolled this identical
 * effect to close their dropdown panel.
 */
export function useMhdClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    function onMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onOutside is expected to be a stable close-panel callback (matches the original per-component effect's deps of just [])
  }, [ref, enabled]);
}
