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

/**
 * The elevated "3D" card shell (radius, border, shadow) shared by every
 * place a person-identity form is presented — the standalone Complete
 * Profile page and the embedded new-person panel on Invite User — so a
 * shadow/radius change only has to happen once.
 */
export const MHD_ELEVATED_CARD_CLASS =
  'rounded-xl border border-border bg-card shadow-[0_24px_48px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)]';

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
