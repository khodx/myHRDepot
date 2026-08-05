import { useNavigate, useParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdPlatformUser, useMhdUpdatePlatformUser } from '@/features/users/Hook';
import { MhdUserForm } from '@/features/users/components/MhdUserForm';
import type { MhdUpdatePlatformUserInput } from '@/features/users/Types';

export function MhdUserFormPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const actorUserId = profile?.userId ?? '';
  const canEditCompany = profile?.companyIsPlatformOrg ?? false;
  const userQuery = useMhdPlatformUser(userId ?? '');
  const updateUser = useMhdUpdatePlatformUser(userId ?? '', { actorUserId });

  function handleSubmit(values: MhdUpdatePlatformUserInput) {
    if (!userId) return;
    updateUser.mutate(values, {
      onSuccess: () => navigate(`/users/${userId}`),
    });
  }

  return (
    <div className="mx-auto max-w-[72.8rem] space-y-6">
      <MhdPageHeader
        title="Edit User"
        description="Update the user's company, linked person, and admin flag."
        backTo={userId ? `/users/${userId}` : '/users'}
        backLabel="User profile"
      />

      {userQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading user...</p>
      ) : userQuery.isError || !userQuery.data ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {userQuery.error instanceof Error ? userQuery.error.message : 'Unable to load user.'}
        </p>
      ) : (
        <MhdCard className="p-5">
          <MhdUserForm
            user={userQuery.data}
            isSubmitting={updateUser.isPending}
            canEditCompany={canEditCompany}
            onSubmit={handleSubmit}
            onCancel={() => navigate(userId ? `/users/${userId}` : '/users')}
          />
          {updateUser.isError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {updateUser.error instanceof Error ? updateUser.error.message : 'Unable to save user.'}
            </p>
          ) : null}
        </MhdCard>
      )}
    </div>
  );
}
