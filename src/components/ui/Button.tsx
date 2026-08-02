import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import {
  buttonBaseClasses,
  buttonVariantClasses,
  type ButtonVariant,
} from '@/components/ui/buttonStyles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBaseClasses, buttonVariantClasses[variant], className)}
      {...props}
    />
  );
}
