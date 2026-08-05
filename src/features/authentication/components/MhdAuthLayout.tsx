import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MhdAuthLayoutProps {
  children: ReactNode;
  maxWidthClassName?: string;
}

export function MhdAuthLayout({ children, maxWidthClassName = 'max-w-md' }: MhdAuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className={cn('w-full', maxWidthClassName)}>{children}</section>
    </main>
  );
}
