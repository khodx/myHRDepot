import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdDismissQueuedDocument,
  useMhdDocumentQueue,
  useMhdGenerateQueuedDocument,
} from '../Hook';
import type { MhdDocumentQueueItem, MhdDocumentQueueStatus } from '../Types';
import {
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS,
  MHD_DOCUMENT_QUEUE_STATUS_LABELS,
  MHD_DOCUMENT_QUEUE_STATUSES,
  MHD_DOCUMENT_SOURCE_WIZARD_LABELS,
  mhdFormatDocumentEntityType,
} from '../Types';

type QueueFilter = MhdDocumentQueueStatus | 'OPEN' | 'ALL';

/** Rows someone still has to act on. Failed ones belong here: they need a retry or a dismissal. */
const OPEN_STATUSES: readonly MhdDocumentQueueStatus[] = ['QUEUED', 'GENERATING', 'FAILED'];

const STATUS_VARIANTS: Record<MhdDocumentQueueStatus, MhdBadgeVariant> = {
  QUEUED: 'info',
  GENERATING: 'warning',
  GENERATED: 'success',
  FAILED: 'error',
  DISMISSED: 'neutral',
};

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (message.includes('blocked by the pre-live compliance review gate')) {
    return 'This document is blocked until its compliance content has been approved. Ask a Platform Admin to review it.';
  }
  return message || 'Unable to load the document queue.';
}

function QueueStatus({ item }: { item: MhdDocumentQueueItem }) {
  return (
    <div className="space-y-1">
      <MhdBadge variant={STATUS_VARIANTS[item.status]}>
        {MHD_DOCUMENT_QUEUE_STATUS_LABELS[item.status]}
      </MhdBadge>
      {item.requiresSignature ? (
        <p className="text-xs text-muted-foreground">Signature required</p>
      ) : null}
      {item.employeeFileCategory ? (
        <p className="text-xs text-muted-foreground">
          Files to: {MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS[item.employeeFileCategory]}
        </p>
      ) : null}
      {item.status === 'FAILED' && item.failureReason ? (
        <p className="text-xs text-muted-foreground">{item.failureReason}</p>
      ) : null}
      {item.status === 'GENERATED' && item.requiresSignature ? (
        <p className="text-xs text-muted-foreground">Send it for signature from E-Signature.</p>
      ) : null}
    </div>
  );
}

function QueueActions({
  item,
  isPending,
  onGenerate,
  onDismiss,
}: {
  item: MhdDocumentQueueItem;
  isPending: boolean;
  onGenerate: () => void;
  onDismiss: () => void;
}) {
  if (item.status === 'GENERATED' && item.outputDriveFileId) {
    return (
      <div className="space-y-1">
        <a
          className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          href={`https://drive.google.com/file/d/${item.outputDriveFileId}/view`}
          target="_blank"
          rel="noreferrer"
        >
          View Document
        </a>
        {item.outputFileName ? (
          <p className="max-w-48 break-words text-xs text-muted-foreground">
            {item.outputFileName}
          </p>
        ) : null}
      </div>
    );
  }

  if (item.status === 'QUEUED' || item.status === 'FAILED' || item.status === 'GENERATING') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="text-xs" onClick={onGenerate} disabled={isPending}>
          {isPending
            ? 'Generating…'
            : item.status === 'GENERATING'
              ? 'Resume Generation'
              : 'Generate Now'}
        </Button>
        {item.status !== 'GENERATING' ? (
          <Button variant="secondary" className="text-xs" onClick={onDismiss} disabled={isPending}>
            Dismiss
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}

export function MhdDocumentQueuePage() {
  const { profile } = useMhdAuth();
  const [filter, setFilter] = useState<QueueFilter>('OPEN');
  const [dismissItem, setDismissItem] = useState<MhdDocumentQueueItem | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  // "Open" spans three statuses, which the server filters one at a time, so it asks for all
  // of them and narrows here.
  const queueQuery = useMhdDocumentQueue(profile?.companyId ?? null, {
    status: filter === 'OPEN' ? 'ALL' : filter,
  });
  const generate = useMhdGenerateQueuedDocument();
  const dismiss = useMhdDismissQueuedDocument();
  const allItems = queueQuery.data ?? [];
  const items =
    filter === 'OPEN' ? allItems.filter((item) => OPEN_STATUSES.includes(item.status)) : allItems;
  const mutationError = generate.error ?? dismiss.error;
  const error = queueQuery.error ?? mutationError;

  function openDismiss(item: MhdDocumentQueueItem) {
    setDismissItem(item);
    setDismissReason('');
  }

  function submitDismiss() {
    if (!dismissItem || !dismissReason.trim()) return;
    // mutate (not mutateAsync): a refusal is shown through dismiss.error rather than rejecting.
    dismiss.mutate(
      { queueId: dismissItem.id, reason: dismissReason.trim() },
      {
        onSuccess: () => {
          setDismissItem(null);
          setDismissReason('');
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Documents To Generate"
        description="Documents your wizards saved to generate later. Generate one when you are ready, or dismiss it."
        backTo="/reports"
        backLabel="Reports"
      />

      <div className="flex items-center gap-2">
        <label htmlFor="document-queue-status" className="text-sm font-medium text-foreground">
          Status
        </label>
        <select
          id="document-queue-status"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={filter}
          onChange={(event) => setFilter(event.target.value as QueueFilter)}
        >
          <option value="OPEN">Open (Queued, Generating, Failed)</option>
          <option value="ALL">All</option>
          {MHD_DOCUMENT_QUEUE_STATUSES.map((queueStatus) => (
            <option key={queueStatus} value={queueStatus}>
              {MHD_DOCUMENT_QUEUE_STATUS_LABELS[queueStatus]}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessage(error)}
        </div>
      ) : null}

      <MhdCard className="overflow-hidden p-0">
        {queueQuery.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading documents…</p>
        ) : items.length === 0 ? (
          <MhdEmptyState
            title="Nothing waiting"
            description="Documents saved to generate later will appear here."
          />
        ) : (
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Document</MhdTh>
                <MhdTh>Record</MhdTh>
                <MhdTh>Source</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Queued By</MhdTh>
                <MhdTh>Queued</MhdTh>
                <MhdTh>Actions</MhdTh>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isPending = generate.isPending && generate.variables?.queueId === item.id;
                return (
                  <MhdTr key={item.id}>
                    <MhdTd className="font-semibold">{item.referenceId}</MhdTd>
                    <MhdTd>
                      <p>{item.templateName ?? item.templateKey}</p>
                      <p className="text-xs text-muted-foreground">{item.templateKey}</p>
                    </MhdTd>
                    <MhdTd>
                      <p>{mhdFormatDocumentEntityType(item.entityType)}</p>
                      {item.subjectPersonName ? (
                        <p className="text-xs text-muted-foreground">{item.subjectPersonName}</p>
                      ) : null}
                    </MhdTd>
                    <MhdTd>{MHD_DOCUMENT_SOURCE_WIZARD_LABELS[item.sourceWizard]}</MhdTd>
                    <MhdTd>
                      <QueueStatus item={item} />
                    </MhdTd>
                    <MhdTd>{item.queuedByName ?? item.queuedBy ?? '—'}</MhdTd>
                    <MhdTd className="whitespace-nowrap text-muted-foreground">
                      {new Date(item.queuedAt).toLocaleString()}
                    </MhdTd>
                    <MhdTd>
                      <QueueActions
                        item={item}
                        isPending={isPending}
                        onGenerate={() =>
                          generate.mutate({ queueId: item.id, entityType: item.entityType })
                        }
                        onDismiss={() => openDismiss(item)}
                      />
                    </MhdTd>
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
        )}
      </MhdCard>

      {dismissItem ? (
        <MhdModal title="Dismiss Document" onClose={() => setDismissItem(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitDismiss();
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="dismiss-reason" className="text-sm font-medium text-foreground">
                Reason
              </label>
              <textarea
                id="dismiss-reason"
                required
                value={dismissReason}
                onChange={(event) => setDismissReason(event.target.value)}
                className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDismissItem(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dismissReason.trim() || dismiss.isPending}>
                Dismiss Document
              </Button>
            </div>
          </form>
        </MhdModal>
      ) : null}
    </div>
  );
}

export default MhdDocumentQueuePage;
