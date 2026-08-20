import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Plus } from 'lucide-react';
import { mhdCanMutateMemorandums } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdMultiSelectCombobox, type MhdMultiSelectComboboxOption } from '@/components/ui/MhdMultiSelectCombobox';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateMemorandum,
  useMhdMemorandumDeliveries,
  useMhdMemorandumPeople,
  useMhdMemorandums,
  useMhdPublishMemorandum,
} from '../Hook';
import { MHD_MEMORANDUM_CATEGORIES, mhdFormatMemorandumValue, type MhdMemorandumCategory, type MhdMemorandumListItem } from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function MhdMemorandumsPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canMutate = mhdCanMutateMemorandums(roles);

  const memorandums = useMhdMemorandums(companyId);
  const people = useMhdMemorandumPeople(companyId);
  const createMemorandum = useMhdCreateMemorandum();
  const publishMemorandum = useMhdPublishMemorandum();

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    body: '',
    category: 'GENERAL' as MhdMemorandumCategory,
    requiresAcknowledgment: false,
  });

  const [publishing, setPublishing] = useState<MhdMemorandumListItem | null>(null);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [audienceLabel, setAudienceLabel] = useState('');
  const [sendEmail, setSendEmail] = useState(false);

  const [board, setBoard] = useState<MhdMemorandumListItem | null>(null);
  const deliveries = useMhdMemorandumDeliveries(board?.id ?? null);

  const [error, setError] = useState<string | null>(null);

  const peopleOptions: MhdMultiSelectComboboxOption[] = (people.data ?? []).map((person) => ({
    id: person.id,
    label: person.displayName,
  }));

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
    }
  }

  async function submitCreate() {
    if (!companyId) return;
    await run(async () => {
      await createMemorandum.mutateAsync({
        companyId,
        title: draft.title,
        body: draft.body,
        category: draft.category,
        requiresAcknowledgment: draft.requiresAcknowledgment,
      });
      setCreating(false);
      setDraft({ title: '', body: '', category: 'GENERAL', requiresAcknowledgment: false });
    });
  }

  async function submitPublish() {
    if (!publishing) return;
    await run(async () => {
      await publishMemorandum.mutateAsync({
        memorandumId: publishing.id,
        recipientPersonIds: recipientIds,
        audienceLabel: audienceLabel.trim() || undefined,
        sendEmail,
      });
      setPublishing(null);
      setRecipientIds([]);
      setAudienceLabel('');
      setSendEmail(false);
    });
  }

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">No company is associated with your account.</p>;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Memorandums"
        description="Author and distribute formal company memorandums."
        actions={
          canMutate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Memorandum
            </Button>
          ) : null
        }
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {memorandums.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading memorandums...</p>
      ) : !memorandums.data || memorandums.data.length === 0 ? (
        <MhdEmptyState icon={Mail} title="No memorandums yet" description="Create the first memorandum for your company." />
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Title</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Acknowledgment</MhdTh>
                <MhdTh>Audience</MhdTh>
                <MhdTh>Recipients</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {memorandums.data.map((item) => (
                <MhdTr key={item.id}>
                  <MhdTd>
                    <p className="font-medium">{item.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.referenceId}</p>
                  </MhdTd>
                  <MhdTd>
                    <MhdBadge variant={item.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {mhdFormatMemorandumValue(item.status)}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd>{item.requiresAcknowledgment ? 'Required' : 'Not required'}</MhdTd>
                  <MhdTd>{item.audienceLabel ?? '—'}</MhdTd>
                  <MhdTd>{item.recipientCount}</MhdTd>
                  <MhdTd className="text-right">
                    <div className="flex justify-end gap-3">
                      {item.status === 'DRAFT' && canMutate ? (
                        <button
                          type="button"
                          className="text-sm font-medium text-accent"
                          onClick={() => setPublishing(item)}
                        >
                          Publish
                        </button>
                      ) : null}
                      {item.status === 'PUBLISHED' && canMutate ? (
                        <button type="button" className="text-sm font-medium text-accent" onClick={() => setBoard(item)}>
                          Deliveries
                        </button>
                      ) : null}
                      <Link className="text-sm font-medium text-accent" to={`/my-memorandums`}>
                        View
                      </Link>
                    </div>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {creating ? (
        <MhdModal title="New memorandum" onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <MhdCardHeader title="New memorandum" />
            <input
              className={inputClass}
              placeholder="Title"
              value={draft.title}
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
            />
            <textarea
              className={`${inputClass} min-h-32`}
              placeholder="Memorandum body"
              value={draft.body}
              onChange={(event) => setDraft((value) => ({ ...value, body: event.target.value }))}
            />
            <select
              className={inputClass}
              value={draft.category}
              onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value as MhdMemorandumCategory }))}
            >
              {MHD_MEMORANDUM_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {mhdFormatMemorandumValue(value)}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.requiresAcknowledgment}
                onChange={(event) => setDraft((value) => ({ ...value, requiresAcknowledgment: event.target.checked }))}
              />
              Require signed acknowledgment from recipients
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button disabled={createMemorandum.isPending} onClick={() => void submitCreate()}>
                {createMemorandum.isPending ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </MhdModal>
      ) : null}

      {publishing ? (
        <MhdModal title={`Publish "${publishing.title}"`} onClose={() => setPublishing(null)}>
          <div className="space-y-4">
            <div>
              <span className="mb-1 block text-sm font-medium">Recipients</span>
              <MhdMultiSelectCombobox
                options={peopleOptions}
                value={recipientIds}
                onChange={setRecipientIds}
                placeholder="Search people..."
              />
            </div>
            <label className="block text-sm font-medium">
              Audience label (for display only)
              <input
                className={`mt-1 ${inputClass}`}
                placeholder="e.g. All Company, Engineering Department"
                value={audienceLabel}
                onChange={(event) => setAudienceLabel(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendEmail} onChange={(event) => setSendEmail(event.target.checked)} />
              Also send by email
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPublishing(null)}>
                Cancel
              </Button>
              <Button disabled={recipientIds.length === 0 || publishMemorandum.isPending} onClick={() => void submitPublish()}>
                {publishMemorandum.isPending ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>
        </MhdModal>
      ) : null}

      {board ? (
        <MhdModal title={`Deliveries — ${board.title}`} onClose={() => setBoard(null)}>
          {deliveries.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !deliveries.data || deliveries.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliveries recorded.</p>
          ) : (
            <ul className="space-y-2">
              {deliveries.data.map((delivery) => (
                <li key={delivery.personId} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{delivery.personId}</span>
                  <span>
                    {delivery.readAt ? 'Read' : 'Unread'}
                    {delivery.acknowledgmentStatus ? ` · ${mhdFormatMemorandumValue(delivery.acknowledgmentStatus)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MhdModal>
      ) : null}
    </div>
  );
}
