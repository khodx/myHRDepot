import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdRecordTabNav, useMhdRecordTabAction } from '@/components/ui/MhdRecordTabNav';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { cn } from '@/utils/cn';

export type MhdTaskRecordTab =
  | 'detail'
  | 'notes'
  | 'activities'
  | 'attachments'
  | 'reports'
  | 'messages'
  | 'audit';

// Same privileged set as the /tasks/:taskId/audit route rule in
// mhdRouteAccess.ts and the RPC's own server-side check
// (mhd_assert_task_audit_timeline_access, 42501 for anyone else). Hiding the
// tab here is UX only — the route guard and the RPC are the enforcement —
// mirroring how MhdFormsPage hides its builder link for non-privileged roles.
const MHD_TASK_AUDIT_TAB_ROLES: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner'];

interface MhdTaskRecordTabsProps {
  taskId: string;
  active: MhdTaskRecordTab;
  className?: string;
  /** Route to the task's edit form. Omit to hide the Edit action. */
  editTo?: string;
  /** Omit to hide the Delete action. */
  onDelete?: () => void | Promise<void>;
  deleteConfirmMessage?: string;
}

/**
 * Record-nav buttons for a single task: Detail / Notes / Activities /
 * Attachments / Reports / Audit — each its own routed page. Audit is
 * appended last and only for Platform Admin / HR Partner (see
 * MHD_TASK_AUDIT_TAB_ROLES above). Rendered as buttons (primary when active,
 * secondary otherwise), not underlined tabs, matching the platform-wide
 * "these are buttons" convention. Edit and Delete render to the right of the
 * nav buttons, same height/text size but keeping their established
 * warning/destructive colors so they still read as distinct actions rather
 * than navigation.
 */
export function MhdTaskRecordTabs({
  taskId,
  active,
  className,
  editTo,
  onDelete,
  deleteConfirmMessage = 'Delete this task? This cannot be undone.',
}: MhdTaskRecordTabsProps) {
  const { pending: deleting, run: handleDelete } = useMhdRecordTabAction(onDelete, {
    confirmMessage: deleteConfirmMessage,
  });
  const { roles } = useMhdAuth();
  const canViewAudit = MHD_TASK_AUDIT_TAB_ROLES.some((role) => roles.includes(role));

  const tabs: Array<{ key: MhdTaskRecordTab; label: string; to: string }> = [
    { key: 'detail', label: 'Detail', to: `/tasks/${taskId}` },
    { key: 'notes', label: 'Notes', to: `/tasks/${taskId}/notes` },
    { key: 'attachments', label: 'Attachments', to: `/tasks/${taskId}/attachments` },
    { key: 'activities', label: 'Activities', to: `/tasks/${taskId}/activities` },
    { key: 'reports', label: 'Reports', to: `/tasks/${taskId}/reports` },
    { key: 'messages', label: 'Messages', to: `/tasks/${taskId}/messages` },
    ...(canViewAudit
      ? [{ key: 'audit' as const, label: 'Audit', to: `/tasks/${taskId}/audit` }]
      : []),
  ];

  return (
    <MhdRecordTabNav tabs={tabs} active={active} className={className}>
      {editTo || onDelete ? (
        <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-2">
          {editTo ? (
            <Link
              to={editTo}
              className={cn(
                buttonBaseClasses,
                buttonVariantClasses.warning,
                'h-9 px-3 text-[16.8px]',
              )}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Link>
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
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
        </div>
      ) : null}
    </MhdRecordTabNav>
  );
}
