import { Trash2 } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdRecordTabNav, useMhdRecordTabAction } from '@/components/ui/MhdRecordTabNav';
import { cn } from '@/utils/cn';

export type MhdInvestigationCaseRecordTab = 'detail';

interface MhdInvestigationCaseRecordTabsProps {
  caseId: string;
  active: MhdInvestigationCaseRecordTab;
  className?: string;
  /** Omit to hide the Delete action. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  /**
   * Skip the built-in window.confirm before calling onDelete. Investigations'
   * delete action opens the existing Status & Findings panel preset to
   * CLOSED (which already requires a disposition before it submits), so a
   * second generic confirm on top of that flow would be redundant.
   */
  skipConfirm?: boolean;
}

/**
 * Record-nav row for a single investigation case: Detail (only tab today —
 * there is no role gate on this page at all; access is per-grant, and every
 * section renders inline rather than as separate routes) with Delete (Close
 * Case) pinned to the right, mirroring MhdTaskRecordTabs' button-pill
 * convention and Edit/Delete placement. There is no separate edit route for
 * an investigation case.
 */
export function MhdInvestigationCaseRecordTabs({
  caseId,
  active,
  className,
  onDelete,
  deleteLabel = 'Close Case',
  deleteConfirmMessage = 'Close this investigation? This cannot be undone.',
  skipConfirm = false,
}: MhdInvestigationCaseRecordTabsProps) {
  const { pending: deleting, run: handleDelete } = useMhdRecordTabAction(onDelete, {
    skipConfirm,
    confirmMessage: deleteConfirmMessage,
  });

  const tabs: Array<{ key: MhdInvestigationCaseRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/investigations/${caseId}` },
  ];

  return (
    <MhdRecordTabNav tabs={tabs} active={active} className={className}>
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
    </MhdRecordTabNav>
  );
}
