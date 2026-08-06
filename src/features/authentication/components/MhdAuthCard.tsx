import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MhdAuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function MhdAuthCard({ title, description, children, className }: MhdAuthCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)]',
        className,
      )}
    >
      <div className="mb-6">
        <p className="text-[1.006rem] font-semibold uppercase tracking-wide text-accent">My HR Depot</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
