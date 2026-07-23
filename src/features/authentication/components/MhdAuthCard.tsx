import type { ReactNode } from 'react';

interface MhdAuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function MhdAuthCard({ title, description, children }: MhdAuthCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">My HR Depot</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
