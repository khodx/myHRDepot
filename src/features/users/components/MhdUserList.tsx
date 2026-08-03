import { Users } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { mhdPaginationSummary, MhdPaginationControls, useMhdPagination } from '@/components/ui/MhdPagination';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import type { MhdPlatformUser } from '@/features/users/Types';

interface MhdUserListProps {
  users: MhdPlatformUser[];
  isLoading: boolean;
}

export function MhdUserList({ users, isLoading }: MhdUserListProps) {
  const pagination = useMhdPagination(users.length, {
    resetKey: `${users.length}:${users[0]?.id ?? ''}`,
  });

  if (isLoading) {
    return <MhdCard className="text-sm text-muted-foreground">Loading users...</MhdCard>;
  }

  if (users.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={Users}
          title="No users found"
          description="Adjust the company filter or search term."
        />
      </MhdCard>
    );
  }

  const visibleUsers = pagination.sliceItems(users);

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Email</MhdTh>
            <MhdTh>Company</MhdTh>
            <MhdTh>Linked Person</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Admin</MhdTh>
            <MhdTh>Updated</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((user) => (
            <MhdTr key={user.id} to={`/users/${user.id}`}>
              <MhdTd className="font-semibold text-foreground">{user.email}</MhdTd>
              <MhdTd className="text-muted-foreground">
                {user.companyName ?? 'Company unavailable'}
              </MhdTd>
              <MhdTd className="text-muted-foreground">{user.personDisplayName ?? '-'}</MhdTd>
              <MhdTd>
                {user.deactivatedAt ? (
                  <MhdBadge variant="warning">Deactivated</MhdBadge>
                ) : (
                  <MhdBadge variant="success">Active</MhdBadge>
                )}
              </MhdTd>
              <MhdTd>
                {user.isAdmin ? (
                  <MhdBadge variant="accent">Admin</MhdBadge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </MhdTd>
              <MhdTd className="whitespace-nowrap text-muted-foreground">
                {new Date(user.updatedAt).toLocaleDateString()}
              </MhdTd>
              <MhdTableActions viewTo={`/users/${user.id}`} />
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
      <MhdTableFooter summary={mhdPaginationSummary(pagination, users.length, 'users')}>
        <MhdPaginationControls pagination={pagination} />
      </MhdTableFooter>
    </MhdCard>
  );
}
