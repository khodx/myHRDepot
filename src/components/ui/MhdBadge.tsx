import type { ReactNode } from 'react';
import { AlertTriangle, OctagonAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Semantic status set (MHD Design System §5) plus the module-accent variant.
 * Statuses always render as labeled pills — never bare color — which is what
 * keeps module accents (e.g. Dashboard red) unambiguous next to status reds.
 * Error and warning pills additionally carry an icon (§8: never color-alone).
 */
export type MhdBadgeVariant = 'error' | 'warning' | 'success' | 'info' | 'neutral' | 'accent';

const VARIANT_CLASSES: Record<MhdBadgeVariant, string> = {
  error: 'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-800',
  success: 'bg-green-100 text-green-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-700',
  accent: 'bg-accent-tint text-accent-hover',
};

const VARIANT_ICONS: Partial<Record<MhdBadgeVariant, typeof AlertTriangle>> = {
  error: OctagonAlert,
  warning: AlertTriangle,
};

interface MhdBadgeProps {
  variant: MhdBadgeVariant;
  children: ReactNode;
  /** Suppress the automatic error/warning icon (dense table cells). */
  hideIcon?: boolean;
  className?: string;
}

export function MhdBadge({ variant, children, hideIcon, className }: MhdBadgeProps) {
  const Icon = hideIcon ? undefined : VARIANT_ICONS[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}

/** Priority pills reuse the semantic set (§5): High=error, Medium=warning, Low=success. */
export function mhdPriorityBadgeVariant(priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'): MhdBadgeVariant {
  switch (priority) {
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'neutral';
  }
}
