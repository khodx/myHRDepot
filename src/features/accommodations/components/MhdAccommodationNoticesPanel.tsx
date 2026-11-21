import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdDocumentService } from '@/features/documents/Service';
import {
  useMhdAccommodationNotice,
  useMhdAccommodationNoticeDelivery,
  useMhdAccommodationNotices,
} from '../Hook';
import { mhdFormatAccommodationValue } from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** The document entity type accommodation notice templates are tagged with (migration 0391). */
const ACCOMMODATION_NOTICE_ENTITY_TYPE = 'ACCOMMODATION_CASE';

const NOTICE_TYPES = [
  'REQUEST_ACKNOWLEDGMENT',
  'INFORMATION_REQUEST',
  'INTERACTIVE_PROCESS_MEETING',
  'DECISION',
  'DENIAL',
  'IMPLEMENTATION',
  'FOLLOW_UP',
];

export function MhdAccommodationNoticesPanel({ caseId }: { caseId: string }) {
  const { authUserId, profile } = useMhdAuth();
  const notices = useMhdAccommodationNotices(caseId);
  const createNotice = useMhdAccommodationNotice(caseId);
  const deliverNotice = useMhdAccommodationNoticeDelivery(caseId);
  const templates = useQuery({
    queryKey: [
      'mhd-accommodations',
      'notice-templates',
      profile?.companyId ?? '',
      ACCOMMODATION_NOTICE_ENTITY_TYPE,
    ],
    queryFn: () =>
      mhdDocumentService.listTemplates(
        profile!.companyId,
        undefined,
        false,
        ACCOMMODATION_NOTICE_ENTITY_TYPE,
      ),
    enabled: Boolean(profile?.companyId),
  });
  // A notice records the template's stable key (the database refuses anything else), so only
  // accommodation templates that carry one can be chosen.
  const noticeTemplates = (templates.data ?? []).filter(
    (template) =>
      template.applicableEntityType === ACCOMMODATION_NOTICE_ENTITY_TYPE &&
      Boolean(template.templateKey),
  );
  const [open, setOpen] = useState(false);
  const [noticeType, setNoticeType] = useState(NOTICE_TYPES[0]);
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The notice action failed.');
    }
  }

  return (
    <MhdCard className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <MhdCardHeader title="Notices" />
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          New Notice
        </Button>
      </div>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {open ? (
        <div className="space-y-3 rounded-md border border-border p-3">
          <select
            className={inputClass}
            aria-label="Notice Type"
            value={noticeType}
            onChange={(event) => setNoticeType(event.target.value)}
          >
            {NOTICE_TYPES.map((value) => (
              <option key={value} value={value}>
                {mhdFormatAccommodationValue(value)}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            aria-label="Document Template"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="">Select a document template</option>
            {noticeTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} (v{template.version})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              disabled={createNotice.isPending || !templateId || !authUserId || !profile?.companyId}
              onClick={() =>
                void run(async () => {
                  const template = noticeTemplates.find((item) => item.id === templateId);
                  if (!template?.templateKey) throw new Error('Select a document template.');
                  const generation = await mhdDocumentService.generateAndPoll(
                    {
                      templateId: template.id,
                      companyId: profile!.companyId,
                      entityType: ACCOMMODATION_NOTICE_ENTITY_TYPE,
                      entityId: caseId,
                      mergeData: {},
                    },
                    { actorUserId: authUserId! },
                  );
                  await createNotice.mutateAsync({
                    caseId,
                    noticeType,
                    templateKey: template.templateKey,
                    templateVersion: template.version,
                    documentGenerationId: generation.id,
                  });
                  setOpen(false);
                  setTemplateId('');
                })
              }
            >
              {createNotice.isPending ? 'Recording…' : 'Create Notice'}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {notices.isLoading ? <p className="text-sm text-muted-foreground">Loading notices…</p> : null}
      {notices.data?.length
        ? notices.data.map((notice) => (
            <div
              key={notice.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
            >
              <div>
                <p className="font-medium">{mhdFormatAccommodationValue(notice.notice_type)}</p>
                <p className="text-sm text-muted-foreground">
                  {mhdFormatAccommodationValue(notice.status)} · issued{' '}
                  {notice.issued_at ? new Date(notice.issued_at).toLocaleDateString() : 'not set'}
                </p>
              </div>
              {notice.status !== 'DELIVERED' ? (
                <Button
                  variant="secondary"
                  disabled={deliverNotice.isPending}
                  onClick={() =>
                    void run(() =>
                      deliverNotice.mutateAsync({ noticeId: notice.id, status: 'DELIVERED' }),
                    )
                  }
                >
                  Mark Delivered
                </Button>
              ) : null}
            </div>
          ))
        : null}
      {!notices.isLoading && !notices.data?.length ? (
        <p className="text-sm text-muted-foreground">No notices recorded.</p>
      ) : null}
    </MhdCard>
  );
}
