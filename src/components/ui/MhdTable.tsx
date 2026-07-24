import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
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
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function MhdTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-border bg-muted px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function MhdTr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-border last:border-b-0 hover:bg-muted/50', className)}
      {...props}
    />
  );
}

export function MhdTd({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-foreground', className)} {...props} />;
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
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-[13px] text-muted-foreground">{summary}</p>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  );
}
