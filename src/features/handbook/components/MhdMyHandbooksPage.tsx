import { useState } from 'react';
import { useMhdAcknowledgeHandbook, useMhdMyAcknowledgments } from '../Hook';
import {
  mhdFormatHandbookAckStatus,
  mhdFormatHandbookType,
  type MhdMyAcknowledgment,
} from '../Types';
import { MhdHandbookVersionView } from './MhdHandbookVersionView';

interface Props {
  /**
   * APP-LAYER e-sign ceremony hook. When provided, invoking it runs the host
   * route's signature flow for this acknowledgment and resolves to the completed
   * e-signature request id, which is forwarded to `acknowledge`. The server GATES
   * `acknowledge` on that request being COMPLETED — so this callback is expected
   * to return only once signing finished. When absent (the shell path), acknowledge
   * is called directly and succeeds if no signature request is attached. This
   * module never invents an E-Sign RPC; it only forwards the id the callback returns.
   */
  onSign?: (item: MhdMyAcknowledgment) => Promise<string | null>;
}

/**
 * `/my-handbooks` — the employee acknowledgment surface.
 *
 * Any authenticated employee reaches this page; it is gated by identity, not by
 * the privileged role that governs the admin `/handbooks` wizard and board. The
 * list is the employee's OWN acknowledgments (`my_acknowledgments`, narrowed by
 * `auth.uid()` server-side). Acknowledging is GATED server-side on the signature
 * completing — this page surfaces the server's "signature not yet complete" error
 * rather than pre-empting it.
 */
export function MhdMyHandbooksPage({ onSign }: Props) {
  const acknowledgments = useMhdMyAcknowledgments();

  const pending = (acknowledgments.data ?? []).filter((item) => item.status === 'PENDING');
  const done = (acknowledgments.data ?? []).filter((item) => item.status === 'ACKNOWLEDGED');

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">My handbooks</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Handbooks assigned to you to review and acknowledge, and your acknowledgment history.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">To acknowledge</h2>
        {acknowledgments.isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-neutral-500">You have nothing to acknowledge.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((item) => (
              <MhdMyHandbookRow key={item.id} item={item} onSign={onSign} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-neutral-900">Acknowledged</h2>
          <ul className="space-y-2">
            {done.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {item.handbookTitle}{' '}
                    <span className="text-neutral-500">v{item.versionNumber}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {mhdFormatHandbookType(item.handbookType)}
                    {item.acknowledgedAt
                      ? ` · acknowledged ${new Date(item.acknowledgedAt).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  {mhdFormatHandbookAckStatus(item.status)}
                </span>
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
  onSign?: (item: MhdMyAcknowledgment) => Promise<string | null>;
}

/**
 * One pending acknowledgment. The employee can read the frozen version (read-only,
 * placeholder bodies clearly marked) and acknowledge it. Kept as its own component
 * so the review/sign state is isolated per row.
 */
function MhdMyHandbookRow({ item, onSign }: RowProps) {
  const acknowledge = useMhdAcknowledgeHandbook();
  const [isViewing, setIsViewing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  async function handleAcknowledge() {
    // App-layer signature ceremony: if wired, run signing first and forward the
    // completed request's id. The server still GATES on that request being
    // COMPLETED — we do not pre-empt it, and its error surfaces below.
    let esignatureRequestId: string | null = null;
    if (onSign) {
      setIsSigning(true);
      try {
        esignatureRequestId = await onSign(item);
      } finally {
        setIsSigning(false);
      }
    }
    await acknowledge.mutateAsync({ ackId: item.id, esignatureRequestId });
  }

  return (
    <li className="space-y-3 rounded-md border border-neutral-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {item.handbookTitle} <span className="text-neutral-500">v{item.versionNumber}</span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-600">{mhdFormatHandbookType(item.handbookType)}</p>
          {item.esignatureRequestId ? (
            <p className="mt-1 text-xs text-amber-700">
              A signature is required — acknowledgment records only once signing is complete.
            </p>
          ) : null}
        </div>
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {mhdFormatHandbookAckStatus(item.status)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsViewing((previous) => !previous)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
        >
          {isViewing ? 'Hide handbook' : 'Review handbook'}
        </button>
        <button
          type="button"
          onClick={() => void handleAcknowledge()}
          disabled={acknowledge.isPending || isSigning}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSigning
            ? 'Signing…'
            : acknowledge.isPending
              ? 'Recording…'
              : onSign
                ? 'Sign & acknowledge'
                : 'Acknowledge'}
        </button>
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
        <div className="border-t border-neutral-200 pt-3">
          {/* The frozen version, read-only. This is what the acknowledgment attests to. */}
          <MhdHandbookVersionView versionId={item.handbookVersionId} />
        </div>
      ) : null}
    </li>
  );
}
