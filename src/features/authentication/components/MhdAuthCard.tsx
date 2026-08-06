import type { ReactNode } from 'react';
import { MHD_ELEVATED_CARD_CLASS } from '@/components/ui/MhdFieldLabel';
import { cn } from '@/utils/cn';

interface MhdAuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function MhdAuthCard({ title, description, children, className }: MhdAuthCardProps) {
  return (
    <div className={cn(MHD_ELEVATED_CARD_CLASS, 'p-6', className)}>
      <div className="mb-6">
        <p className="text-[1.006rem] font-semibold uppercase tracking-wide text-accent">My HR Depot</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
