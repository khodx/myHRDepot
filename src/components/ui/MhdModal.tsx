import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMhdFocusTrap } from '@/utils/useMhdFocusTrap';

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
 * focus-restore logic is shared with `MhdMobileNavDrawer`
 * (`src/appshell/MhdSidebar.tsx`) via `useMhdFocusTrap` — before 2026-08-06
 * (audit finding M16) each component hand-rolled its own identical copy.
 */
export function MhdModal({ onClose, title, children, className }: MhdModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useMhdFocusTrap(dialogRef, onClose);

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
