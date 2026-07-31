import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'warning';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

// Hover/press feedback is one consistent dim (see buttonBaseClasses' shared
// hover:opacity-80 / active:opacity-70) rather than a per-variant color swap
// — every variant below defines only its resting fill/text/focus-ring color.
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on focus-visible:ring-focus-ring',
  secondary: 'bg-slate-100 text-slate-950 focus-visible:ring-slate-500',
  ghost: 'bg-transparent text-slate-950 focus-visible:ring-slate-500',
  // Semantic error red (design system §5), independent of the category accent.
  destructive: 'bg-red-700 text-white focus-visible:ring-red-700',
  // Record-detail Edit action (2026-07-26) — deliberately yellow, distinct from
  // the navy category accent, so Edit reads as its own affordance next to Delete.
  warning: 'bg-yellow-400 text-yellow-950 focus-visible:ring-yellow-400',
};

export const buttonBaseClasses =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-80 active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBaseClasses, buttonVariantClasses[variant], className)}
      {...props}
    />
  );
}
