import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MhdDetailFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MhdDetailField({ label, value, className }: MhdDetailFieldProps) {
  const resolvedValue = value === null || value === undefined || value === '' ? 'Not provided' : value;

  return (
    <div className={cn(className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{resolvedValue}</dd>
    </div>
  );
}
