import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface MhdModalProps {
  /** Called on Escape, backdrop click, or the built-in close button. */
  onClose: () => void;
  /** Accessible name for the dialog (also used as the visible header when provided). */
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Portal-based modal dialog (renders to `document.body`). This is the app's
 * first real dialog primitive — every other overlay in the codebase is a
 * bespoke, non-portal `fixed inset-0 z-50` div. The focus-trap / Escape /
 * focus-restore logic here intentionally mirrors `MhdMobileNavDrawer` in
 * `src/appshell/MhdSidebar.tsx` rather than reinventing it.
 */
export function MhdModal({ onClose, title, children, className }: MhdModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    const focusables = () =>
      dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

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
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:pt-16">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          className ??
          'relative flex w-full max-w-3xl flex-col rounded-lg border border-border bg-background shadow-xl'
        }
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <div className="max-h-[85vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
