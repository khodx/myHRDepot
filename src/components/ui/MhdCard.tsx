import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Canonical surface for operational panels. The design template uses restrained
 * eight-pixel corners and light borders, so keep this quiet and table-friendly.
 */
export function MhdCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', className)}
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
