import {
  useMhdAssignUserRole,
  useMhdRevokeUserRole,
  useMhdUserRoleAssignments,
} from '@/features/roles/Hook';
import { MhdBadge } from './MhdBadge';
import { MhdCard } from './MhdCard';
import { MhdRolePicker } from './MhdRolePicker';

interface MhdUserRolesPanelProps {
  userId: string;
  companyId: string | null;
  /** Whether the current viewer may add/remove roles for this user — the
   *  server (mhd_assign_user_role/mhd_revoke_user_role) re-checks the same
   *  grant ceiling independently; this only decides whether the picker
   *  renders or the roles show as read-only badges. */
  canManage: boolean;
}

/**
 * Displays a user's current role assignments and, for callers who may
 * manage them, an MhdRolePicker whose selection is diffed against the
 * fetched assignments to fire individual mhd_assign_user_role /
 * mhd_revoke_user_role calls — those RPCs are singular grant/revoke, not a
 * bulk replace-set, so this component owns the diffing rather than the
 * picker itself.
 */
export function MhdUserRolesPanel({ userId, companyId, canManage }: MhdUserRolesPanelProps) {
  const assignmentsQuery = useMhdUserRoleAssignments(userId);
  const assignRole = useMhdAssignUserRole(userId);
  const revokeRole = useMhdRevokeUserRole(userId);

  // Controlled directly from the fetched assignments — both mutations
  // already invalidate this query on success, so the picker's value
  // updates from the refetch rather than a separately-synced local echo.
  const currentRoleIds = (assignmentsQuery.data ?? []).map((a) => a.roleId);

  function handlePickerChange(nextRoleIds: string[]) {
    const added = nextRoleIds.filter((id) => !currentRoleIds.includes(id));
    const removed = currentRoleIds.filter((id) => !nextRoleIds.includes(id));

    added.forEach((roleId) => assignRole.mutate(roleId));
    removed.forEach((roleId) => revokeRole.mutate(roleId));
  }

  const isSaving = assignRole.isPending || revokeRole.isPending;
  const mutationError = assignRole.error ?? revokeRole.error;

  return (
    <MhdCard className="p-6">
      <h2 className="text-sm font-semibold text-foreground">Roles</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        A user may hold multiple roles at once. Changes take effect immediately.
      </p>

      {assignmentsQuery.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading roles...</p>
      ) : assignmentsQuery.isError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {assignmentsQuery.error instanceof Error
            ? assignmentsQuery.error.message
            : 'Unable to load this user’s roles.'}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {(assignmentsQuery.data ?? []).length === 0 ? (
            <span className="text-sm text-muted-foreground">No roles assigned.</span>
          ) : (
            (assignmentsQuery.data ?? []).map((assignment) => (
              <MhdBadge key={assignment.assignmentId} variant="neutral">
                {assignment.roleName}
              </MhdBadge>
            ))
          )}
        </div>
      )}

      {canManage ? (
        <div className="mt-4 border-t border-border pt-4">
          <MhdRolePicker
            value={currentRoleIds}
            onChange={handlePickerChange}
            companyId={companyId}
            placeholder="Add or remove a role..."
          />
          {isSaving ? <p className="mt-2 text-xs text-muted-foreground">Saving...</p> : null}
          {mutationError ? (
            <p className="mt-2 text-xs text-red-700">
              {mutationError instanceof Error ? mutationError.message : 'Unable to update roles.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </MhdCard>
  );
}
