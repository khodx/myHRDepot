import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Canonical surface (MHD Design System §3): rounded-xl, bordered, card bg.
 * Every panel in the app sits on this; do not re-author the recipe inline.
 */
export function MhdCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}
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
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}
