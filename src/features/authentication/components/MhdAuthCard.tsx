import type { ReactNode } from 'react';

interface MhdAuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function MhdAuthCard({ title, description, children }: MhdAuthCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">My HR Depot</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
