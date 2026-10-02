import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAcknowledgeHandbook, useMhdMyAcknowledgments } from '../Hook';
import {
  mhdFormatHandbookAckStatus,
  mhdFormatHandbookType,
  mhdIsAcknowledgmentOverdue,
  type MhdMyAcknowledgment,
} from '../Types';
import { MhdHandbookPdfDownloadButton } from './MhdHandbookPdfDownloadButton';
import { MhdHandbookVersionView } from './MhdHandbookVersionView';

/**
 * `/my-handbooks` — the employee acknowledgment surface.
 *
 * Any authenticated employee reaches this page; it is gated by identity, not by
 * the privileged role that governs the admin `/handbooks` wizard and board. The
 * list is the employee's OWN acknowledgments (`my_acknowledgments`, narrowed by
 * `auth.uid()` server-side). Acknowledging is GATED server-side: when the handbook
 * requires a signature there must be a signature request, and it must be COMPLETED.
 * This page shows where the person is in that process and surfaces the server's
 * message rather than pre-empting it.
 */
export function MhdMyHandbooksPage() {
  const acknowledgments = useMhdMyAcknowledgments();

  const pending = (acknowledgments.data ?? []).filter((item) => item.status === 'PENDING');
  const done = (acknowledgments.data ?? []).filter((item) => item.status === 'ACKNOWLEDGED');

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="My handbooks"
        description="Handbooks assigned to you to review and acknowledge, and your acknowledgment history."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">To acknowledge</h2>
        {acknowledgments.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have nothing to acknowledge.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((item) => (
              <MhdMyHandbookRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Acknowledged</h2>
          <ul className="space-y-2">
            {done.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.handbookTitle}{' '}
                    <span className="text-muted-foreground">v{item.versionNumber}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {mhdFormatHandbookType(item.handbookType)}
                    {item.acknowledgedAt
                      ? ` · acknowledged ${new Date(item.acknowledgedAt).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <MhdHandbookPdfDownloadButton versionId={item.handbookVersionId} />
                  <MhdBadge variant="success">{mhdFormatHandbookAckStatus(item.status)}</MhdBadge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

interface RowProps {
  item: MhdMyAcknowledgment;
}

/**
 * One pending acknowledgment. The employee can read the frozen version (read-only,
 * placeholder bodies clearly marked), keep a PDF, and acknowledge it. When the handbook
 * requires a signature, the row says where the person is: waiting for HR to send the
 * signature request, or waiting for them to sign it from the emailed link. Kept as its
 * own component so the review state is isolated per row.
 */
function MhdMyHandbookRow({ item }: RowProps) {
  const acknowledge = useMhdAcknowledgeHandbook();
  const [isViewing, setIsViewing] = useState(false);
  const overdue = mhdIsAcknowledgmentOverdue(item.dueAt, item.status);
  // Nothing to acknowledge against yet: a signature is required but none has been sent.
  const awaitingRequest = item.requiresSignature && !item.esignatureRequestId;

  function handleAcknowledge() {
    // The server GATES this (a required signature must exist and be COMPLETED); its
    // message is shown below, never pre-empted here.
    acknowledge.mutate({ ackId: item.id });
  }

  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {item.handbookTitle}{' '}
            <span className="text-muted-foreground">v{item.versionNumber}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {mhdFormatHandbookType(item.handbookType)}
            {item.dueAt ? ` · due ${new Date(item.dueAt).toLocaleDateString()}` : ''}
          </p>
          {overdue ? (
            <p className="mt-1 text-xs font-medium text-rose-700">
              This acknowledgment is overdue. Please review and acknowledge it as soon as you can.
            </p>
          ) : null}
          {awaitingRequest ? (
            <p className="mt-1 text-xs text-amber-700">
              A signature is required. HR has not sent your signature request yet — you will get an
              email with a signing link.
            </p>
          ) : item.esignatureRequestId ? (
            <p className="mt-1 text-xs text-amber-700">
              A signature is required — check your email for the signing link. You can acknowledge
              once signing is complete.
            </p>
          ) : null}
        </div>
        <MhdBadge variant={overdue ? 'error' : 'warning'}>
          {overdue ? 'Overdue' : mhdFormatHandbookAckStatus(item.status)}
        </MhdBadge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setIsViewing((previous) => !previous)}>
          {isViewing ? 'Hide handbook' : 'Review handbook'}
        </Button>
        <MhdHandbookPdfDownloadButton versionId={item.handbookVersionId} />
        <Button onClick={handleAcknowledge} disabled={acknowledge.isPending || awaitingRequest}>
          {acknowledge.isPending ? 'Recording…' : 'Acknowledge'}
        </Button>
      </div>

      {/* Surface the server's error — notably the signature gate refusal — verbatim. */}
      {acknowledge.isError ? (
        <p className="text-xs text-rose-600">
          {acknowledge.error instanceof Error
            ? acknowledge.error.message
            : 'Could not record the acknowledgment.'}
        </p>
      ) : null}

      {isViewing ? (
        <div className="border-t border-border pt-3">
          {/* The frozen version, read-only. This is what the acknowledgment attests to. */}
          <MhdHandbookVersionView versionId={item.handbookVersionId} />
        </div>
      ) : null}
    </li>
  );
}
