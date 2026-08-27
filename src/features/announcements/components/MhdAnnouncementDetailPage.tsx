import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { mhdCanMutateAnnouncements } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAnnouncement, useMhdArchiveAnnouncement, useMhdPublishAnnouncement } from '../Hook';
import { MHD_ANNOUNCEMENT_STATUS_LABELS } from '../Types';

export function MhdAnnouncementDetailPage() {
  const navigate = useNavigate();
  const { announcementId } = useParams();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateAnnouncements(roles);

  const announcement = useMhdAnnouncement(announcementId ?? null);
  const publish = useMhdPublishAnnouncement();
  const archive = useMhdArchiveAnnouncement();
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!announcementId) return;
    setError(null);
    try {
      await publish.mutateAsync(announcementId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to publish this announcement.');
    }
  }

  async function handleArchive() {
    if (!announcementId) return;
    setError(null);
    try {
      await archive.mutateAsync(announcementId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to archive this announcement.');
    }
  }

  const detail = announcement.data;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/communications/announcements"
        backLabel="Announcements"
        title={detail?.title ?? 'Announcement'}
        description={detail?.referenceId}
        actions={
          canMutate && detail ? (
            <>
              {detail.status === 'draft' || detail.status === 'scheduled' ? (
                <Button onClick={() => void handlePublish()} disabled={publish.isPending}>
                  {publish.isPending ? 'Publishing...' : 'Publish Now'}
                </Button>
              ) : null}
              {detail.status !== 'archived' ? (
                <Button variant="secondary" onClick={() => navigate(`/communications/announcements/${detail.id}/edit`)}>
                  Edit
                </Button>
              ) : null}
              {detail.status !== 'archived' ? (
                <Button variant="secondary" onClick={() => void handleArchive()} disabled={archive.isPending}>
                  {archive.isPending ? 'Archiving...' : 'Archive'}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      {announcement.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading announcement...</p>
      ) : !detail ? (
        <MhdEmptyState
          icon={Megaphone}
          title="Announcement not found"
          description="This announcement is unavailable or you do not have access to it."
        />
      ) : (
        <>
          <MhdCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <MhdBadge variant={detail.status === 'published' ? 'success' : 'neutral'}>
                {MHD_ANNOUNCEMENT_STATUS_LABELS[detail.status]}
              </MhdBadge>
              <MhdDetailField label="Audience" value={detail.audienceScope === 'roles' ? (detail.audienceRoles ?? []).join(', ') : 'Company-wide'} />
            </div>
            <div className="mt-2 space-y-4">
              <MhdDetailField label="Published or scheduled" value={detail.publishedAt ? `Published ${new Date(detail.publishedAt).toLocaleString()}` : detail.publishAt ? `Scheduled for ${new Date(detail.publishAt).toLocaleString()}` : null} />
              <MhdDetailField label="Expires" value={detail.expiresAt ? new Date(detail.expiresAt).toLocaleString() : null} />
            </div>
          </MhdCard>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <MhdCard>
            <MhdRichTextRenderer html={mhdDocumentToRichHtml(detail.bodyRichText, detail.bodyPlainText)} />
          </MhdCard>
        </>
      )}
    </div>
  );
}
