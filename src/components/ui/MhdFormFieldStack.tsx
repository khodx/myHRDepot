import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MhdFormFieldStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MhdFormFieldStack({ children, className, ...props }: MhdFormFieldStackProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}
