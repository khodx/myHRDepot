import { cn } from '@/utils/cn';

interface MhdSystemFieldsCardProps {
  /** Raw UUID primary key, shown alongside the human-readable reference ID. */
  id: string;
  referenceId: string;
  createdAt: string;
  /** Display name of the creating actor, when resolvable. Falls back to their user id. */
  createdByName?: string | null;
  createdBy?: string | null;
  updatedAt: string;
  updatedByName?: string | null;
  updatedBy?: string | null;
  className?: string;
}

/**
 * Bottom-of-page "System Fields" card for detail pages: the raw UUID next to
 * the human-readable reference ID, plus both created and updated
 * timestamp/actor pairs. Shared so every detail page renders this the same
 * way instead of a bespoke inline footer.
 */
export function MhdSystemFieldsCard({
  id,
  referenceId,
  createdAt,
  createdByName,
  createdBy,
  updatedAt,
  updatedByName,
  updatedBy,
  className,
}: MhdSystemFieldsCardProps) {
  const createdActor = createdByName ?? createdBy ?? null;
  const updatedActor = updatedByName ?? updatedBy ?? null;

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-card p-6 shadow-sm',
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-neutral-900">System Fields</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">Reference ID</dt>
          <dd className="mt-0.5 text-neutral-700">{referenceId}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">UUID</dt>
          <dd className="mt-0.5 break-all font-mono text-xs text-neutral-700">{id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">Created</dt>
          <dd className="mt-0.5 text-neutral-700">
            {new Date(createdAt).toLocaleString()}
            {createdActor ? ` — ${createdActor}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">Updated</dt>
          <dd className="mt-0.5 text-neutral-700">
            {new Date(updatedAt).toLocaleString()}
            {updatedActor ? ` — ${updatedActor}` : ''}
          </dd>
        </div>
      </dl>
    </div>
  );
}
