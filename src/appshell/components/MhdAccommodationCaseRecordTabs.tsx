import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdAccommodationCaseRecordTab = 'detail';

interface MhdAccommodationCaseRecordTabsProps {
  caseId: string;
  active: MhdAccommodationCaseRecordTab;
  className?: string;
  /** Omit to hide the Delete action. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  /**
   * Skip the built-in window.confirm before calling onDelete. Accommodations'
   * delete action opens the existing "Close case" reason-required dialog, so
   * a second generic confirm on top of that flow would be redundant.
   */
  skipConfirm?: boolean;
}

/**
 * Record-nav row for a single accommodation case: Detail (only tab today —
 * the process/options/decision/implementation/medical sub-views are in-page
 * MhdTabs state, not routes) with Delete (Close Case) pinned to the right,
 * mirroring MhdTaskRecordTabs' button-pill convention and Edit/Delete
 * placement. There is no separate edit route for an accommodation case.
 */
export function MhdAccommodationCaseRecordTabs({
  caseId,
  active,
  className,
  onDelete,
  deleteLabel = 'Close Case',
  deleteConfirmMessage = 'Close this accommodation case? This cannot be undone.',
  skipConfirm = false,
}: MhdAccommodationCaseRecordTabsProps) {
  const [deleting, setDeleting] = useState(false);

  const tabs: Array<{ key: MhdAccommodationCaseRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/accommodations/${caseId}` },
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
