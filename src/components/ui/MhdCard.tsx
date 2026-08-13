import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MhdCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Pronounced layered shadow + inset bevel (see .mhd-card-elevated in
   *  global.css) for high-emphasis surfaces, echoing the nav rail's raised
   *  active-item treatment. Default false keeps the standard flat shadow-md
   *  used across ordinary operational panels. */
  elevated?: boolean;
}

/**
 * Canonical surface for operational panels — matches MhdFilterBar's beveled
 * edge (border-border) plus a raised shadow so panels read as distinct cards.
 */
export function MhdCard({ className, elevated = false, ...props }: MhdCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        elevated ? 'mhd-card-elevated' : 'shadow-md',
        className,
      )}
      {...props}
    />
  );
}

interface MhdCardHeaderProps {
  title: ReactNode;
  /** Right-aligned slot — "View all" links, kebab menus, selects. */
  action?: ReactNode;
  className?: string;
}

/** Card title row: section-title type on the left, optional action on the right. */
export function MhdCardHeader({ title, action, className }: MhdCardHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}
