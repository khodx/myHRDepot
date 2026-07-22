import {
  mhdFormatTrainingCompletionMethod,
  type MhdTrainingCompletion,
} from '../Types';

interface Props {
  completions: MhdTrainingCompletion[];
  isLoading?: boolean;
  /** Optional heading override — the panel is reused on My Training and admin views. */
  title?: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

/**
 * A person's completion history — the append-only evidence ledger, read.
 *
 * `isExpired` is DERIVED server-side (`expires_at <= now`) and rendered verbatim;
 * this panel never re-derives expiry by comparing `expiresAt` to the clock, so an
 * expired completion always reads as expired and never quietly as "complete". A
 * null `expiresAt` is a one-time course — shown as "no expiry", not as a gap.
 */
export function MhdCompletionHistoryPanel({
  completions,
  isLoading = false,
  title = 'Completion history',
}: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading history…</p>
      ) : completions.length === 0 ? (
        <p className="text-sm text-neutral-500">No completions on record.</p>
      ) : (
        <ul className="space-y-2">
          {completions.map((completion) => (
            <li
              key={completion.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 p-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{completion.courseTitle}</p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  Completed {formatDate(completion.completedAt)} ·{' '}
                  {mhdFormatTrainingCompletionMethod(completion.completionMethod)}
                  {completion.attachmentId ? ' · certificate on file' : ''}
                </p>
                <p className="mt-0.5 font-mono text-xs text-neutral-400">{completion.referenceId}</p>
              </div>

              <div className="text-right">
                {/* Render the server's derived is_expired, never a local recompute. */}
                {completion.expiresAt == null ? (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                    No expiry
                  </span>
                ) : completion.isExpired ? (
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                    Expired {formatDate(completion.expiresAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    Valid to {formatDate(completion.expiresAt)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
