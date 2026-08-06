import type { ReactNode } from 'react';
import { MhdTooltip } from '@/components/ui/MhdTooltip';
import { cn } from '@/utils/cn';

/**
 * Shared form-field chrome. One source of truth for input/label styling so
 * forms built independently (auth pages, admin panels, future applicant
 * flows) can't silently drift from each other the way MhdPersonIdentityFields
 * and MhdUserInvitePage's own fields once did.
 */
export const MHD_FIELD_INPUT_CLASS =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
export const MHD_FIELD_INPUT_DISABLED_CLASS =
  'mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground focus-visible:outline-none';
export const MHD_FIELD_LABEL_CLASS =
  'flex flex-nowrap items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground';

interface MhdFieldLabelProps {
  htmlFor: string;
  required?: boolean;
  tooltip?: { label: string; children: string };
  className?: string;
  children: ReactNode;
}

export function MhdFieldLabel({
  htmlFor,
  required = false,
  tooltip,
  className,
  children,
}: MhdFieldLabelProps) {
  return (
    <label className={cn(MHD_FIELD_LABEL_CLASS, className)} htmlFor={htmlFor}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
      {tooltip && <MhdTooltip label={tooltip.label}>{tooltip.children}</MhdTooltip>}
    </label>
  );
}
