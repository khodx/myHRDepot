import type { ReactNode } from 'react';

export function MhdAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md">{children}</section>
    </main>
  );
}
