import type { ElementType, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MhdEmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  /** Call-to-action slot, usually a primary Button. */
  action?: ReactNode;
  className?: string;
}

/** Empty-list placeholder: tinted icon circle, title, hint, optional CTA. */
export function MhdEmptyState({ icon: Icon, title, description, action, className }: MhdEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-12 text-center', className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
          <Icon className="h-6 w-6 text-accent-hover" aria-hidden />
        </span>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
