import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { mhdAccommodationReviewCompletionSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS,
  MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS_LABELS,
  MHD_ACCOMMODATION_REVIEW_OUTCOMES_REQUIRING_REENGAGEMENT,
  type MhdAccommodationReviewEffectiveness,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

interface MhdAccommodationReviewCompletionProps {
  isPending: boolean;
  onComplete: (input: {
    effectiveness: MhdAccommodationReviewEffectiveness;
    summary: string;
    reengageRequired: boolean;
  }) => Promise<void>;
}

/**
 * Effectiveness-review completion form. The caller owns the RPC and its error
 * display; this owns only draft state and client-side validation, so a refusal
 * from the server is shown by the page and the draft is kept for correction.
 */
export function MhdAccommodationReviewCompletion({
  isPending,
  onComplete,
}: MhdAccommodationReviewCompletionProps) {
  const [effectiveness, setEffectiveness] =
    useState<MhdAccommodationReviewEffectiveness>('EFFECTIVE');
  const [summary, setSummary] = useState('');
  const [reengage, setReengage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const forced = MHD_ACCOMMODATION_REVIEW_OUTCOMES_REQUIRING_REENGAGEMENT.includes(effectiveness);
  const reengageChecked = forced || reengage;

  async function submit() {
    const parsed = mhdAccommodationReviewCompletionSchema.safeParse({
      effectiveness,
      summary,
      reengageRequired: reengageChecked,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Check the review details.');
      return;
    }
    setValidationError(null);
    await onComplete({
      effectiveness,
      summary: parsed.data.summary,
      reengageRequired: reengageChecked,
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="block text-sm font-medium">
        Review Outcome
        <select
          className={`mt-1 ${inputClass}`}
          value={effectiveness}
          onChange={(event) =>
            setEffectiveness(event.target.value as MhdAccommodationReviewEffectiveness)
          }
        >
          {MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS.map((value) => (
            <option key={value} value={value}>
              {MHD_ACCOMMODATION_REVIEW_EFFECTIVENESS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Review Summary
        <textarea
          className={`mt-1 min-h-24 ${inputClass}`}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="How is the accommodation working in practice?"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={reengageChecked}
          disabled={forced}
          onChange={(event) => setReengage(event.target.checked)}
        />
        Re-Engage The Interactive Process
      </label>
      {forced ? (
        <p className="text-xs text-muted-foreground">
          This outcome requires the interactive process to resume.
        </p>
      ) : null}
      {validationError ? <p className="text-sm text-rose-800">{validationError}</p> : null}
      <Button
        variant="secondary"
        disabled={isPending || !summary.trim()}
        onClick={() => void submit()}
      >
        Complete Review
      </Button>
    </div>
  );
}
