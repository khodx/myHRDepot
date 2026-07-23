import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on hover:bg-accent-hover focus-visible:ring-accent',
  secondary: 'bg-slate-100 text-slate-950 hover:bg-slate-200 focus-visible:ring-slate-500',
  ghost: 'bg-transparent text-slate-950 hover:bg-slate-100 focus-visible:ring-slate-500',
  // Semantic error red (design system §5), independent of the module accent.
  destructive: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700',
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
