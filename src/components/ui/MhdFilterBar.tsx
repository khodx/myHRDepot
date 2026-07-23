import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface MhdFilterBarProps {
  children: ReactNode;
  /** "Clear all" handler; the link renders only when provided. */
  onClear?: () => void;
  className?: string;
}

/** Horizontal filter row above a table (§3): labelled controls + optional Clear all. */
export function MhdFilterBar({ children, onClear, className }: MhdFilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="pb-2 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

interface MhdFilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

/** Labelled select in the filter bar's visual style. */
export function MhdFilterSelect({ label, className, id, ...props }: MhdFilterSelectProps) {
  const selectId = id ?? `mhd-filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label htmlFor={selectId} className="flex min-w-36 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        id={selectId}
        className={cn(
          'rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className,
        )}
        {...props}
      />
    </label>
  );
}
