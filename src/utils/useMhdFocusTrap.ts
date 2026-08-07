import { useEffect, type RefObject } from 'react';

const MHD_DEFAULT_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab focus within `containerRef`'s element, closes on Escape, locks
 * body scroll, and restores focus to whatever was focused before the trap
 * activated. Before 2026-08-06 (audit finding M16), MhdModal and
 * MhdSidebar's MhdMobileNavDrawer each independently hand-rolled this
 * identical effect (MhdModal's own comment already noted it "intentionally
 * mirrors" the drawer's version rather than reusing it).
 */
export function useMhdFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  options?: { focusableSelector?: string },
) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const selector = options?.focusableSelector ?? MHD_DEFAULT_FOCUSABLE_SELECTOR;

    const focusables = () =>
      container ? Array.from(container.querySelectorAll<HTMLElement>(selector)) : [];

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- matches the original per-component effect's deps of [onClose]; containerRef/options are expected stable
  }, [onClose]);
}
