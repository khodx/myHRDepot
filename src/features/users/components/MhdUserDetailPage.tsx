import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdUserRolesPanel } from '@/components/ui/MhdUserRolesPanel';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import {
  useMhdDeactivatePlatformUser,
  useMhdDeletePlatformUser,
  useMhdPlatformUser,
  useMhdReactivatePlatformUser,
} from '@/features/users/Hook';
import type { MhdPlatformUser } from '@/features/users/Types';

interface MhdUserStatusActionProps {
  user: MhdPlatformUser;
}

function MhdUserStatusAction({ user }: MhdUserStatusActionProps) {
  const deactivateUser = useMhdDeactivatePlatformUser();
  const reactivateUser = useMhdReactivatePlatformUser();

  function handleDeactivate() {
    if (deactivateUser.isPending) return;
    if (
      !window.confirm(
        `Deactivate ${user.email}'s login? They will no longer be able to access the app.`,
      )
    ) {
      return;
    }
    deactivateUser.mutate(user.id);
  }

  function handleReactivate() {
    if (reactivateUser.isPending) return;
    reactivateUser.mutate(user.id);
  }

  return user.deactivatedAt ? (
    <Button variant="secondary" onClick={handleReactivate} disabled={reactivateUser.isPending}>
      {reactivateUser.isPending ? 'Reactivating…' : 'Reactivate'}
    </Button>
  ) : (
    <Button variant="warning" onClick={handleDeactivate} disabled={deactivateUser.isPending}>
      {deactivateUser.isPending ? 'Deactivating…' : 'Deactivate'}
    </Button>
  );
}

export function MhdUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const userQuery = useMhdPlatformUser(userId ?? '');
  const deleteUser = useMhdDeletePlatformUser();
  const { roles } = useMhdAuth();
  const canManageRoles = mhdIsPlatformAdmin(roles) || roles.includes('Client Admin');

  function handleDelete() {
    if (!userId) return;
    return deleteUser.mutateAsync(userId).then(() => navigate('/users'));
  }

  if (userQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading user...</p>;
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {userQuery.error instanceof Error ? userQuery.error.message : 'User not found.'}
      </p>
    );
  }

  const user = userQuery.data;
  const userChips =
    user.isAdmin || user.deactivatedAt ? (
      <>
        {user.isAdmin ? <MhdBadge variant="accent">Admin</MhdBadge> : null}
        {user.deactivatedAt ? <MhdBadge variant="warning">Deactivated</MhdBadge> : null}
      </>
    ) : null;

  return (
    <div className="mx-auto max-w-[62.4rem] space-y-6">
      <MhdPageHeader
        title={user.email}
        description="Platform login account"
        chips={userChips}
        backTo="/users"
        backLabel="Users"
        actions={
          <>
            <MhdDetailActions
              editTo={`/users/${user.id}/edit`}
              onDelete={handleDelete}
              deleteConfirmMessage={`Remove ${user.email}'s login? This deletes their app account but does not revoke their sign-in credentials.`}
            />
            <MhdUserStatusAction user={user} />
          </>
        }
      />

      <MhdCard className="p-6">
        <dl className="space-y-4 text-sm">
          <MhdDetailField label="Company" value={user.companyName} />
          <MhdDetailField label="Linked person" value={user.personDisplayName} />
          <MhdDetailField label="Created" value={new Date(user.createdAt).toLocaleString()} />
          <MhdDetailField label="Updated" value={new Date(user.updatedAt).toLocaleString()} />
          <MhdDetailField label="Deactivated" value={user.deactivatedAt ? new Date(user.deactivatedAt).toLocaleString() : null} />
        </dl>
      </MhdCard>

      <MhdUserRolesPanel userId={user.id} companyId={user.companyId} canManage={canManageRoles} />

      <div className="flex justify-end border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <MhdDetailActions
            editTo={`/users/${user.id}/edit`}
            onDelete={handleDelete}
            deleteConfirmMessage={`Remove ${user.email}'s login? This deletes their app account but does not revoke their sign-in credentials.`}
          />
          <MhdUserStatusAction user={user} />
        </div>
      </div>
    </div>
  );
}
