import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { MhdCard, MhdCardHeader } from './MhdCard';

interface MhdDetailLayoutProps {
  /** Main column: description, subtasks, comments, tabs content… */
  children: ReactNode;
  /** Right rail: stack of MhdRightRailCard (Information, Progress, Tags, Quick Actions). */
  rail: ReactNode;
  className?: string;
}

/**
 * Detail-page anatomy (MHD Design System §3): wide main column + fixed-width
 * right rail that stacks under the main column on narrow screens.
 */
export function MhdDetailLayout({ children, rail, className }: MhdDetailLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-4 xl:flex-row', className)}>
      <div className="min-w-0 flex-1 space-y-4">{children}</div>
      <aside className="w-full shrink-0 space-y-4 xl:w-80">{rail}</aside>
    </div>
  );
}

interface MhdRightRailCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/** Titled card for the right rail. */
export function MhdRightRailCard({ title, children, className }: MhdRightRailCardProps) {
  return (
    <MhdCard className={className}>
      <MhdCardHeader title={title} />
      {children}
    </MhdCard>
  );
}

interface MhdRailFactProps {
  label: string;
  children: ReactNode;
}

/** Label/value row inside a rail Information card. */
export function MhdRailFact({ label, children }: MhdRailFactProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-foreground">{children}</span>
    </div>
  );
}
