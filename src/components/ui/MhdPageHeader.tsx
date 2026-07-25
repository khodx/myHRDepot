import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MhdPageHeaderProps {
  title: ReactNode;
  /** One-line purpose statement under the title. */
  description?: ReactNode;
  /** Status/priority chips rendered inline after the title (detail pages). */
  chips?: ReactNode;
  /** Right-aligned action buttons. */
  actions?: ReactNode;
  /** Back link target (detail pages) — renders "< Back to {backLabel}". */
  backTo?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Page title block (MHD Design System §3). Replaces the per-page copy-pasted
 * header markup and retires the blue "My HR Depot" eyebrow label.
 */
export function MhdPageHeader({
  title,
  description,
  chips,
  actions,
  backTo,
  backLabel,
  className,
}: MhdPageHeaderProps) {
  return (
    <header className={cn('space-y-2', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back{backLabel ? ` to ${backLabel}` : ''}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[32px] font-semibold leading-tight text-foreground">{title}</h1>
          {chips}
        </div>
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
      {description && <p className="max-w-4xl text-[15px] text-muted-foreground">{description}</p>}
    </header>
  );
}
