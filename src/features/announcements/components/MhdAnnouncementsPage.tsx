import { Link, useNavigate } from 'react-router-dom';
import { Megaphone, Plus } from 'lucide-react';
import { MhdCommunicationsTabs } from '@/appshell/components/MhdCommunicationsTabs';
import { mhdCanMutateAnnouncements } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActiveAnnouncements, useMhdAnnouncements } from '../Hook';
import { MHD_ANNOUNCEMENT_STATUS_LABELS, type MhdAnnouncementStatus } from '../Types';

const STATUS_BADGE_VARIANT: Record<MhdAnnouncementStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  draft: 'neutral',
  scheduled: 'info',
  published: 'success',
  expired: 'neutral',
  archived: 'neutral',
};

export function MhdAnnouncementsPage() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canMutate = mhdCanMutateAnnouncements(roles);

  const privileged = useMhdAnnouncements(canMutate ? companyId : null);
  const activeFeed = useMhdActiveAnnouncements(canMutate ? null : companyId);

  const items = canMutate ? privileged.data : activeFeed.data;
  const isLoading = canMutate ? privileged.isLoading : activeFeed.isLoading;

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">No company is associated with your account.</p>;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Announcements"
        description="Company-wide and role-scoped broadcast notices."
        actions={
          canMutate ? (
            <Button onClick={() => navigate('/communications/announcements/new')}>
              <Plus className="mr-1.5 h-4 w-4" /> New Announcement
            </Button>
          ) : null
        }
      />

      <MhdCommunicationsTabs active="announcements" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading announcements...</p>
      ) : !items || items.length === 0 ? (
        <MhdEmptyState
          icon={Megaphone}
          title="No announcements yet"
          description={canMutate ? 'Create the first announcement for your company.' : 'Nothing has been published yet.'}
        />
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Title</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Audience</MhdTh>
                <MhdTh>Published</MhdTh>
                <MhdTh>Expires</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <MhdTr key={item.id}>
                  <MhdTd>
                    <p className="font-medium">{item.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.referenceId}</p>
                  </MhdTd>
                  <MhdTd>
                    {'status' in item ? (
                      <MhdBadge variant={STATUS_BADGE_VARIANT[item.status as MhdAnnouncementStatus]}>
                        {MHD_ANNOUNCEMENT_STATUS_LABELS[item.status as MhdAnnouncementStatus]}
                      </MhdBadge>
                    ) : (
                      <MhdBadge variant="success">Published</MhdBadge>
                    )}
                  </MhdTd>
                  <MhdTd>
                    {'audienceScope' in item
                      ? item.audienceScope === 'roles'
                        ? (item.audienceRoles ?? []).join(', ')
                        : 'Company-wide'
                      : '—'}
                  </MhdTd>
                  <MhdTd>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Not yet'}</MhdTd>
                  <MhdTd>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'None'}</MhdTd>
                  <MhdTd className="text-right">
                    <Link className="text-sm font-medium text-accent" to={`/communications/announcements/${item.id}`}>
                      {canMutate ? 'Open' : 'Read'}
                    </Link>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
