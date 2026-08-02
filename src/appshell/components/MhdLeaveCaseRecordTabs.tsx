import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

export type MhdLeaveCaseRecordTab = 'detail';

interface MhdLeaveCaseRecordTabsProps {
  caseId: string;
  active: MhdLeaveCaseRecordTab;
  className?: string;
  /** Omit to hide the Delete action. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  /**
   * Skip the built-in window.confirm before calling onDelete. Leaves' delete
   * action opens the existing status-transition panel preset to CANCELLED
   * (which already requires a typed reason before it submits), so a second
   * generic confirm on top of that flow would be redundant.
   */
  skipConfirm?: boolean;
}

/**
 * Record-nav row for a single leave case: Detail (only tab today — the case
 * has no separate routed sub-pages) with Delete (Cancel Case) pinned to the
 * right, mirroring MhdTaskRecordTabs' button-pill convention and Edit/Delete
 * placement. There is no separate edit route for a leave case — "Edit Bases"
 * and the status/adjustment forms remain inline in the page body.
 */
export function MhdLeaveCaseRecordTabs({
  caseId,
  active,
  className,
  onDelete,
  deleteLabel = 'Cancel Case',
  deleteConfirmMessage = 'Cancel this leave case? This cannot be undone.',
  skipConfirm = false,
}: MhdLeaveCaseRecordTabsProps) {
  const [deleting, setDeleting] = useState(false);

  const tabs: Array<{ key: MhdLeaveCaseRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/leaves/${caseId}` },
  ];

  async function handleDelete() {
    if (!onDelete || deleting) return;
    if (!skipConfirm && !window.confirm(deleteConfirmMessage)) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

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
      {onDelete ? (
        <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-2">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.destructive,
              'h-9 px-3 text-[16.8px]',
            )}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {deleting ? 'Working…' : deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
