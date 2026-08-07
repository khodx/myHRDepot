import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from './buttonStyles';
import { cn } from '@/utils/cn';

export interface MhdRecordTabItem<TKey extends string = string> {
  key: TKey;
  label: string;
  to: string;
}

interface MhdRecordTabNavProps<TKey extends string> {
  tabs: MhdRecordTabItem<TKey>[];
  active: TKey;
  className?: string;
  /** Trailing pinned-right content (Edit/Delete, Void, Arm/Disarm, etc.) — each caller supplies its own block. */
  children?: React.ReactNode;
}

/**
 * The tab-pill row shared by every `*RecordTabs` component (button-style
 * Links, primary when active, secondary otherwise). Before 2026-08-06
 * (audit finding M4), all 20 RecordTabs components under
 * `src/appshell/components/` hand-rolled this identical block; this is now
 * the one implementation they all render through.
 */
export function MhdRecordTabNav<TKey extends string>({
  tabs,
  active,
  className,
  children,
}: MhdRecordTabNavProps<TKey>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            aria-current={isActive ? 'page' : undefined}
            to={tab.to}
            className={cn(
              buttonBaseClasses,
              'h-9 px-3 text-[16.8px]',
              isActive ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      {children}
    </div>
  );
}

/**
 * Shared pending/confirm state machine for a RecordTabs trailing
 * destructive/void action (Delete, Close Case, Rescind Case, Cancel Case,
 * Void Request, etc.). Before 2026-08-06 (audit finding M4), 7 RecordTabs
 * components each hand-rolled this identical pending-state + confirm +
 * finally-reset logic.
 */
export function useMhdRecordTabAction(
  action: (() => void | Promise<void>) | undefined,
  options?: { skipConfirm?: boolean; confirmMessage?: string },
) {
  const [pending, setPending] = useState(false);

  async function run() {
    if (!action || pending) return;
    if (!options?.skipConfirm && options?.confirmMessage && !window.confirm(options.confirmMessage)) {
      return;
    }
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}
