import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdMultiSelectCombobox, type MhdMultiSelectComboboxOption } from '@/components/ui/MhdMultiSelectCombobox';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdPlainTextToRichHtml, mhdRichTextToDocument } from '@/components/ui/MhdRichTextUtils';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAnnouncement, useMhdCreateAnnouncement, useMhdUpdateAnnouncement } from '../Hook';
import type { MhdAnnouncementAudienceScope } from '../Types';

const ROLE_OPTIONS: MhdMultiSelectComboboxOption[] = [
  { id: 'Platform Admin', label: 'Platform Admin' },
  { id: 'HR Partner', label: 'HR Partner' },
  { id: 'Client Admin', label: 'Client Admin' },
  { id: 'Client User', label: 'Client User' },
  { id: 'Viewer', label: 'Viewer' },
];

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdAnnouncementFormPage() {
  const navigate = useNavigate();
  const { announcementId } = useParams();
  const isEdit = Boolean(announcementId);
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;

  const existing = useMhdAnnouncement(announcementId ?? null);
  const createAnnouncement = useMhdCreateAnnouncement();
  const updateAnnouncement = useMhdUpdateAnnouncement();

  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [bodyPlainText, setBodyPlainText] = useState('');
  const [bodyRichText, setBodyRichText] = useState<unknown>(null);
  const [audienceScope, setAudienceScope] = useState<MhdAnnouncementAudienceScope>('company');
  const [audienceRoles, setAudienceRoles] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [expirationMode, setExpirationMode] = useState<'none' | 'onDate'>('none');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the loaded announcement
    setTitle(existing.data.title);
    setBodyPlainText(existing.data.bodyPlainText);
    setBodyHtml(mhdPlainTextToRichHtml(existing.data.bodyPlainText));
    setAudienceScope(existing.data.audienceScope);
    setAudienceRoles(existing.data.audienceRoles ?? []);
    if (existing.data.expiresAt) {
      setExpirationMode('onDate');
      setExpiresAt(existing.data.expiresAt.slice(0, 16));
    }
  }, [existing.data]);

  async function handleSubmit() {
    if (!companyId) return;
    const trimmedTitle = title.trim();
    const trimmedBody = bodyPlainText.trim();
    if (!trimmedTitle || !trimmedBody) {
      setError('Enter a title and body before saving.');
      return;
    }
    if (audienceScope === 'roles' && audienceRoles.length === 0) {
      setError('Select at least one role for a role-scoped announcement.');
      return;
    }
    if (publishMode === 'scheduled' && !scheduledPublishAt) {
      setError('Choose a scheduled publish date/time.');
      return;
    }
    if (expirationMode === 'onDate' && !expiresAt) {
      setError('Choose an expiration date/time.');
      return;
    }

    setError(null);
    const richText =
      bodyRichText ?? mhdRichTextToDocument(bodyHtml || mhdPlainTextToRichHtml(trimmedBody), trimmedBody);
    const publishAt = publishMode === 'scheduled' ? new Date(scheduledPublishAt).toISOString() : undefined;
    const expiresAtIso = expirationMode === 'onDate' ? new Date(expiresAt).toISOString() : undefined;

    try {
      if (isEdit && announcementId) {
        await updateAnnouncement.mutateAsync({
          id: announcementId,
          title: trimmedTitle,
          bodyRichText: richText,
          bodyPlainText: trimmedBody,
          audienceScope,
          audienceRoles: audienceScope === 'roles' ? audienceRoles : null,
          publishAt,
          expiresAt: expiresAtIso ?? null,
        });
        navigate(`/communications/announcements/${announcementId}`);
      } else {
        const { id } = await createAnnouncement.mutateAsync({
          companyId,
          title: trimmedTitle,
          bodyRichText: richText,
          bodyPlainText: trimmedBody,
          audienceScope,
          audienceRoles: audienceScope === 'roles' ? audienceRoles : undefined,
          publishAt,
          expiresAt: expiresAtIso,
        });
        navigate(`/communications/announcements/${id}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the announcement.');
    }
  }

  const isSaving = createAnnouncement.isPending || updateAnnouncement.isPending;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={isEdit ? 'Edit Announcement' : 'New Announcement'}
        backTo="/communications/announcements"
        backLabel="Announcements"
      />

      <MhdCard className="space-y-4">
        <label className="block text-sm font-medium">
          Title
          <input className={`mt-1 ${inputClass}`} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium">Body</span>
          <MhdRichTextEditor
            label="Announcement body"
            html={bodyHtml || mhdPlainTextToRichHtml(bodyPlainText)}
            onChange={(html, plainText, document) => {
              setBodyHtml(html);
              setBodyPlainText(plainText);
              setBodyRichText(document);
            }}
            minHeightClassName="min-h-32"
            placeholder="Write the announcement..."
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Audience</span>
          <select
            className={inputClass}
            value={audienceScope}
            onChange={(event) => setAudienceScope(event.target.value as MhdAnnouncementAudienceScope)}
          >
            <option value="company">Company-wide</option>
            <option value="roles">Specific roles</option>
          </select>
          {audienceScope === 'roles' ? (
            <div className="mt-2">
              <MhdMultiSelectCombobox options={ROLE_OPTIONS} value={audienceRoles} onChange={setAudienceRoles} placeholder="Search roles..." />
            </div>
          ) : null}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Publish</span>
          <select className={inputClass} value={publishMode} onChange={(event) => setPublishMode(event.target.value as 'now' | 'scheduled')}>
            <option value="now">Save as draft (publish later)</option>
            <option value="scheduled">Schedule for a future date/time</option>
          </select>
          {publishMode === 'scheduled' ? (
            <input
              type="datetime-local"
              className={`mt-2 ${inputClass}`}
              value={scheduledPublishAt}
              onChange={(event) => setScheduledPublishAt(event.target.value)}
            />
          ) : null}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Expiration</span>
          <select className={inputClass} value={expirationMode} onChange={(event) => setExpirationMode(event.target.value as 'none' | 'onDate')}>
            <option value="none">Never expires</option>
            <option value="onDate">Expires on a date</option>
          </select>
          {expirationMode === 'onDate' ? (
            <input
              type="datetime-local"
              className={`mt-2 ${inputClass}`}
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/communications/announcements')}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={() => void handleSubmit()}>
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Draft'}
          </Button>
        </div>
      </MhdCard>
    </div>
  );
}
