import { Pencil, Trash2 } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdRecordTabNav, useMhdRecordTabAction } from '@/components/ui/MhdRecordTabNav';
import { cn } from '@/utils/cn';

export type MhdOffboardingCaseRecordTab = 'detail';

interface MhdOffboardingCaseRecordTabsProps {
  caseId: string;
  active: MhdOffboardingCaseRecordTab;
  className?: string;
  /** Toggles the inline "Edit Case" form. Omit to hide the Edit action. */
  onEdit?: () => void;
  editLabel?: string;
  /** Omit to hide the Delete action. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  skipConfirm?: boolean;
}

/**
 * Record-nav row for a single offboarding case: Detail (only tab today — the
 * checklist, property, and exit-interview sections all render inline) with
 * Edit and Delete pinned to the right, mirroring MhdTaskRecordTabs' button-
 * pill convention. Edit toggles the existing inline "Edit Case" form rather
 * than routing — there is no separate edit route for an offboarding case —
 * so it renders as a button, not a Link, unlike Task's routed Edit.
 */
export function MhdOffboardingCaseRecordTabs({
  caseId,
  active,
  className,
  onEdit,
  editLabel = 'Edit Case',
  onDelete,
  deleteLabel = 'Delete Case',
  deleteConfirmMessage = 'Delete this offboarding case? This cannot be undone.',
  skipConfirm = false,
}: MhdOffboardingCaseRecordTabsProps) {
  const { pending: deleting, run: handleDelete } = useMhdRecordTabAction(onDelete, {
    skipConfirm,
    confirmMessage: deleteConfirmMessage,
  });

  const tabs: Array<{ key: MhdOffboardingCaseRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/offboarding/${caseId}` },
  ];

  return (
    <MhdRecordTabNav tabs={tabs} active={active} className={className}>
      {onEdit || onDelete ? (
        <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-2">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                buttonBaseClasses,
                buttonVariantClasses.warning,
                'h-9 px-3 text-[16.8px]',
              )}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {editLabel}
            </button>
          ) : null}
          {onDelete ? (
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
              {deleting ? 'Deleting…' : deleteLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </MhdRecordTabNav>
  );
}
