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

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const NOTICE_TYPES = ['REQUEST_ACKNOWLEDGMENT', 'DECISION', 'DENIAL', 'IMPLEMENTATION', 'FOLLOW_UP'];

export function MhdAccommodationNoticesPanel({ caseId }: { caseId: string }) {
  const { authUserId, profile } = useMhdAuth();
  const notices = useMhdAccommodationNotices(caseId);
  const createNotice = useMhdAccommodationNotice(caseId);
  const deliverNotice = useMhdAccommodationNoticeDelivery(caseId);
  const templates = useQuery({
    queryKey: ['mhd-accommodations', 'notice-templates', profile?.companyId ?? ''],
    queryFn: () => mhdDocumentService.listTemplates(profile!.companyId),
    enabled: Boolean(profile?.companyId),
  });
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
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>New Notice</Button>
      </div>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {open ? (
        <div className="space-y-3 rounded-md border border-border p-3">
          <select className={inputClass} value={noticeType} onChange={(event) => setNoticeType(event.target.value)}>
            {NOTICE_TYPES.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
          </select>
          <select className={inputClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">Select a document template</option>
            {(templates.data ?? []).map((template) => <option key={template.id} value={template.id}>{template.name} (v{template.version})</option>)}
          </select>
          <div className="flex gap-2">
            <Button
              disabled={createNotice.isPending || !templateId || !authUserId || !profile?.companyId}
              onClick={() => void run(async () => {
                const template = (templates.data ?? []).find((item) => item.id === templateId);
                if (!template) throw new Error('Select a document template.');
                const generation = await mhdDocumentService.generateAndPoll({
                  templateId: template.id,
                  companyId: profile!.companyId,
                  entityType: 'ACCOMMODATION_CASE',
                  entityId: caseId,
                  mergeData: {},
                }, { actorUserId: authUserId! });
                await createNotice.mutateAsync({
                  caseId,
                  noticeType,
                  templateKey: template.id || template.name,
                  templateVersion: template.version,
                  documentGenerationId: generation.id,
                });
                setOpen(false);
                setTemplateId('');
              })}
            >{createNotice.isPending ? 'Recording…' : 'Create Notice'}</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}
      {notices.isLoading ? <p className="text-sm text-muted-foreground">Loading notices…</p> : null}
      {notices.data?.length ? notices.data.map((notice) => (
        <div key={notice.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
          <div>
            <p className="font-medium">{notice.notice_type.replaceAll('_', ' ')}</p>
            <p className="text-sm text-muted-foreground">{notice.status} · issued {notice.issued_at ? new Date(notice.issued_at).toLocaleDateString() : 'not set'}</p>
          </div>
          {notice.status !== 'DELIVERED' ? <Button variant="secondary" disabled={deliverNotice.isPending} onClick={() => void run(() => deliverNotice.mutateAsync({ noticeId: notice.id, status: 'DELIVERED' }))}>Mark Delivered</Button> : null}
        </div>
      )) : null}
      {!notices.isLoading && !notices.data?.length ? <p className="text-sm text-muted-foreground">No notices recorded.</p> : null}
    </MhdCard>
  );
}
