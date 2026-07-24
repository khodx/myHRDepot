import { useState } from 'react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { useMhdRateCompetency, useMhdReviewCompetencies, useMhdSeedCompetencies } from '../Hook-v2';
import { mhdUnratedCompetencies } from '../Types-v2';

interface Props {
  reviewId: string;
  /** False for the subject's read-only view of a completed review. */
  canRate: boolean;
}

/**
 * The competency ratings on a review — seeded from the job description in force
 * at the review period end.
 *
 * Two spec rules surface here:
 *
 * - **Inherited competencies have no delete control.** They came from the job
 *   description and cannot be removed (the database refuses it); rendering a
 *   delete button that always errors would be worse than not offering one. A
 *   reviewer who considers one inapplicable leaves it unrated and says why.
 * - **Seeding is explicit.** A review with no competencies yet offers a "load
 *   from job description" action rather than seeding silently, so the reviewer
 *   sees where the criteria came from.
 */
export function MhdReviewCompetencyPanel({ reviewId, canRate }: Props) {
  const [drafts, setDrafts] = useState<Record<string, { rating: number | null; comments: string }>>(
    {},
  );

  const competencies = useMhdReviewCompetencies(reviewId);
  const seed = useMhdSeedCompetencies(reviewId);
  const rate = useMhdRateCompetency(reviewId);

  const rows = competencies.data ?? [];
  const unrated = mhdUnratedCompetencies(rows);

  function draftFor(id: string, rating: number | null, comments: string | null) {
    return drafts[id] ?? { rating, comments: comments ?? '' };
  }

  async function saveRating(reviewCompetencyId: string) {
    const draft = drafts[reviewCompetencyId];
    if (!draft || draft.rating === null) return;
    await rate.mutateAsync({
      reviewCompetencyId,
      rating: draft.rating,
      comments: draft.comments.trim() || null,
    });
  }

  if (competencies.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading competencies…</p>;
  }

  if (rows.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Competencies</h2>
        <p className="text-sm text-muted-foreground">
          No competencies loaded yet. They come from the employee's published job description as it
          stood at the end of the review period.
        </p>
        {canRate ? (
          <button
            type="button"
            disabled={seed.isPending}
            onClick={() => void seed.mutateAsync()}
            className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-accent-on disabled:opacity-50"
          >
            {seed.isPending ? 'Loading…' : 'Load from job description'}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-foreground">Competencies</h2>
        {canRate && unrated.length > 0 ? (
          <span className="text-xs text-amber-700">{unrated.length} still to rate</span>
        ) : null}
      </div>

      <ul className="space-y-3">
        {rows.map((competency) => {
          const draft = draftFor(competency.id, competency.rating, competency.comments);
          return (
            <li key={competency.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {competency.competencyName}
                    {competency.isRegulated ? (
                      <MhdBadge variant="warning" hideIcon className="ml-2">
                        Regulated
                      </MhdBadge>
                    ) : null}
                    {!competency.isInherited ? (
                      <MhdBadge variant="neutral" className="ml-2">
                        Added for this review
                      </MhdBadge>
                    ) : null}
                  </p>
                  {competency.category ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{competency.category}</p>
                  ) : null}
                </div>
                {/* No delete control on inherited rows — the database refuses removal, so the UI
                    does not offer it. Added rows could be removed, but that is a rarer action left
                    to the fuller review editor rather than cluttering the rating flow. */}
              </div>

              {canRate ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setDrafts((previous) => ({
                            ...previous,
                            [competency.id]: {
                              ...draft,
                              rating: draft.rating === value ? null : value,
                            },
                          }))
                        }
                        className={`h-8 w-8 rounded-md border text-sm ${
                          draft.rating === value
                            ? 'border-accent bg-accent text-accent-on'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={draft.comments}
                    onChange={(event) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [competency.id]: { ...draft, comments: event.target.value },
                      }))
                    }
                    placeholder="Comment (optional)"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={rate.isPending || draft.rating === null}
                      onClick={() => void saveRating(competency.id)}
                      className="rounded-md border border-border px-3 py-1 text-sm text-foreground disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-foreground">
                  {competency.rating !== null ? `Rated ${competency.rating} / 5` : 'Not yet rated'}
                  {competency.comments ? ` — ${competency.comments}` : ''}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
