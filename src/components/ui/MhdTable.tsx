import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { useContext } from 'react';
import { Link, UNSAFE_NavigationContext, type To } from 'react-router-dom';
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
    <MhdTh className={cn('w-[220px] text-right', className)} {...props}>
      View / Edit / Delete
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

const actionLinkClass =
  'inline-flex h-8 items-center justify-center rounded-md border border-accent-border px-2.5 text-xs font-semibold text-accent transition hover:bg-accent-soft hover:text-accent-hover';
const disabledActionClass =
  'inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground opacity-50';

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
  function handleDelete() {
    if (!onDelete || disableDelete) return;
    if (!window.confirm(deleteConfirmMessage)) return;
    void onDelete();
  }

  return (
    <MhdTd className="whitespace-nowrap text-right">
      <div className="flex justify-end gap-2">
        {viewTo && !disableView ? (
          <Link className={actionLinkClass} to={viewTo}>
            View
          </Link>
        ) : (
          <span className={disabledActionClass}>View</span>
        )}
        {editTo && !disableEdit ? (
          <Link className={actionLinkClass} to={editTo}>
            Edit
          </Link>
        ) : (
          <span className={disabledActionClass}>Edit</span>
        )}
        {onDelete && !disableDelete ? (
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            onClick={handleDelete}
          >
            {deleteLabel}
          </button>
        ) : (
          <span className={disabledActionClass}>Delete</span>
        )}
      </div>
      {secondaryActions ? (
        <div className="mt-2 flex justify-end gap-3 text-xs font-semibold">{secondaryActions}</div>
      ) : null}
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
