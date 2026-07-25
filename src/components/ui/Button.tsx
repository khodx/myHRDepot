import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  // Category primary with the derived hover/pressed states and the 25%-alpha
  // focus ring from the category token block.
  primary:
    'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-pressed focus-visible:ring-focus-ring',
  secondary: 'bg-slate-100 text-slate-950 hover:bg-slate-200 focus-visible:ring-slate-500',
  ghost: 'bg-transparent text-slate-950 hover:bg-slate-100 focus-visible:ring-slate-500',
  // Semantic error red (design system §5), independent of the category accent.
  destructive: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700',
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
