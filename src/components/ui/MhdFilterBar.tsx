import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
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
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-sm',
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7',
        className,
      )}
    >
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="self-end justify-self-start pb-2 text-[13px] font-semibold text-accent hover:text-accent-hover"
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
    <label htmlFor={selectId} className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        id={selectId}
        className={cn(
          'h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className,
        )}
        {...props}
      />
    </label>
  );
}

interface MhdFilterInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function MhdFilterInput({ label, className, id, ...props }: MhdFilterInputProps) {
  const inputId = id ?? `mhd-filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label htmlFor={inputId} className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        id={inputId}
        className={cn(
          'h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className,
        )}
        {...props}
      />
    </label>
  );
}
