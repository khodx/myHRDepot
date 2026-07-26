import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Link, UNSAFE_NavigationContext, type To } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Styled table primitives (MHD Design System §3/§6). Markup-level rather than
 * config-driven so existing per-feature tables can adopt them cell by cell:
 *
 *   <MhdTable>
 *     <thead><tr><MhdTh>Name</MhdTh>…</tr></thead>
 *     <tbody><MhdTr><MhdTd>…</MhdTd></MhdTr>…</tbody>
 *   </MhdTable>
 *
 * Wrap in <MhdCard className="p-0 overflow-hidden"> for the carded look.
 */
export function MhdTable({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-[13px]', className)} {...props} />
    </div>
  );
}

export function MhdTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-accent-border bg-accent-soft px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-accent',
        className,
      )}
      {...props}
    />
  );
}

interface MhdTrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Detail-route destination for record rows. Clicks on nested controls are ignored. */
  to?: To;
}

function isInteractiveTableClickTarget(
  target: EventTarget | null,
  currentTarget: HTMLTableRowElement,
): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const interactiveTarget = target.closest(
    'a,button,input,select,textarea,label,[role="button"],[role="link"],[data-row-click-ignore]',
  );
  return Boolean(interactiveTarget && interactiveTarget !== currentTarget);
}

export function MhdTr({ className, to, onClick, onKeyDown, ...props }: MhdTrProps) {
  const navigationContext = useContext(UNSAFE_NavigationContext);
  const isClickable = Boolean(to || onClick);

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (!isClickable || isInteractiveTableClickTarget(event.target, event.currentTarget)) return;

    onClick?.(event);
    if (!to || event.defaultPrevented) return;

    navigationContext?.navigator.push(to);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    onKeyDown?.(event);
    if (
      !isClickable ||
      event.defaultPrevented ||
      isInteractiveTableClickTarget(event.target, event.currentTarget)
    ) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    event.currentTarget.click();
  }

  return (
    <tr
      {...props}
      className={cn(
        'border-b border-border last:border-b-0 hover:bg-accent-soft/60',
        isClickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : props.tabIndex}
      role={isClickable ? (to ? 'link' : 'button') : props.role}
    />
  );
}

export function MhdTd({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-foreground', className)} {...props} />;
}

export function MhdActionsTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <MhdTh className={cn('w-16 text-right', className)} {...props}>
      Actions
    </MhdTh>
  );
}

interface MhdTableActionsProps {
  viewTo?: string;
  editTo?: string;
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  disableView?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  secondaryActions?: ReactNode;
}

const menuItemClass =
  'block px-3 py-2 text-left text-xs font-medium text-foreground transition hover:bg-accent-soft';
const disabledMenuItemClass = 'block px-3 py-2 text-xs font-medium text-muted-foreground opacity-50';

/**
 * Row actions collapsed into a single kebab menu (2026-07-26 design review —
 * replaces the previous three spelled-out View/Edit/Delete links). Trade-off
 * accepted deliberately: this is denser and matches the reference mockups,
 * but hides the actions behind a click.
 *
 * Known limitation: the menu is a plain absolutely-positioned panel, not a
 * portal, so a card wrapping the table with `overflow-hidden` (the documented
 * convention above) can clip it for rows near the bottom of a short table.
 * Acceptable for now; revisit with a portal-based menu if that turns out to
 * bite in practice.
 */
export function MhdTableActions({
  viewTo,
  editTo,
  onDelete,
  deleteLabel = 'Delete',
  deleteConfirmMessage = 'Delete this record?',
  disableView = false,
  disableEdit = false,
  disableDelete = false,
  secondaryActions,
}: MhdTableActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: globalThis.MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function handleDelete() {
    setOpen(false);
    if (!onDelete || disableDelete) return;
    if (!window.confirm(deleteConfirmMessage)) return;
    void onDelete();
  }

  return (
    <MhdTd className="whitespace-nowrap text-right" data-row-click-ignore>
      <div ref={menuRef} className="relative inline-block text-left">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Row actions"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
          >
            {viewTo && !disableView ? (
              <Link
                role="menuitem"
                to={viewTo}
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                View
              </Link>
            ) : (
              <span className={disabledMenuItemClass}>View</span>
            )}
            {editTo && !disableEdit ? (
              <Link
                role="menuitem"
                to={editTo}
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                Edit
              </Link>
            ) : (
              <span className={disabledMenuItemClass}>Edit</span>
            )}
            {onDelete && !disableDelete ? (
              <button
                type="button"
                role="menuitem"
                className={cn(menuItemClass, 'w-full text-red-700 hover:bg-red-50')}
                onClick={handleDelete}
              >
                {deleteLabel}
              </button>
            ) : (
              <span className={disabledMenuItemClass}>Delete</span>
            )}
            {secondaryActions ? (
              <div className="mt-1 border-t border-border pt-1">{secondaryActions}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MhdTd>
  );
}

interface MhdTableFooterProps {
  /** e.g. "Showing 1 to 10 of 48 tasks" */
  summary: string;
  /** Pagination controls slot. */
  children?: ReactNode;
}

/** Footer row under a table card: result summary left, pagination right. */
export function MhdTableFooter({ summary, children }: MhdTableFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
      <p className="text-[13px] text-muted-foreground">{summary}</p>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  );
}
