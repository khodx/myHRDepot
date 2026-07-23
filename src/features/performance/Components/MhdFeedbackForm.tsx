import { useState } from 'react';
import { useMhdDeclineParticipation, useMhdSubmitFeedback } from '../Hook-v2';
import {
  mhdFeedbackRaterNotice,
  type MhdParticipantType,
  type MhdSubmitFeedbackItem,
} from '../Types-v2';

interface FeedbackItemDraft {
  competencyId?: string | null;
  sectionId?: string | null;
  label: string;
  rating: number | null;
  comment: string;
}

interface Props {
  participantId: string;
  reviewId: string;
  participantType: MhdParticipantType;
  /** The company release threshold — named in the notice, never the response count. */
  threshold: number;
  /** The competencies and sections this rater is asked about. */
  items: FeedbackItemDraft[];
  onDone: () => void;
}

/**
 * A rater answers here — and is told the anonymity terms BEFORE writing, not
 * after (ruling Q4). A peer who believes their words are private and later finds
 * them quoted has been misled by the product, so `mhdFeedbackRaterNotice` states
 * plainly that comments release the same way ratings do, above the same
 * threshold. The notice is shown at the top, where it is read before the first
 * keystroke, not buried at the submit button.
 */
export function MhdFeedbackForm({
  participantId,
  reviewId,
  participantType,
  threshold,
  items,
  onDone,
}: Props) {
  const [drafts, setDrafts] = useState<FeedbackItemDraft[]>(items);
  const [isDeclining, setIsDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const submit = useMhdSubmitFeedback(reviewId);
  const decline = useMhdDeclineParticipation(reviewId);

  function updateDraft(index: number, patch: Partial<FeedbackItemDraft>) {
    setDrafts((previous) => previous.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit() {
    const responses: MhdSubmitFeedbackItem[] = drafts
      .filter((draft) => draft.rating !== null || draft.comment.trim().length > 0)
      .map((draft) => ({
        competencyId: draft.competencyId ?? null,
        sectionId: draft.sectionId ?? null,
        rating: draft.rating,
        comment: draft.comment.trim() || null,
      }));
    await submit.mutateAsync({ participantId, responses });
    onDone();
  }

  async function handleDecline() {
    await decline.mutateAsync({ participantId, reason: declineReason.trim() || null });
    onDone();
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Your feedback</h1>
        {/* The notice, before the first field. Anonymous participants learn that
            their comments are released like their ratings; attributed ones learn
            their name is shown. */}
        <p className="mt-2 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {mhdFeedbackRaterNotice(participantType, threshold)}
        </p>
      </header>

      <div className="space-y-4">
        {drafts.map((draft, index) => (
          <div key={draft.competencyId ?? draft.sectionId ?? index} className="rounded-md border border-border p-4">
            <p className="text-sm font-medium text-foreground">{draft.label}</p>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateDraft(index, { rating: draft.rating === value ? null : value })}
                  className={`h-8 w-8 rounded-md border text-sm ${
                    draft.rating === value
                      ? 'border-accent bg-accent text-accent-on'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {value}
                </button>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">1 = low, 5 = high</span>
            </div>
            <textarea
              rows={2}
              value={draft.comment}
              onChange={(event) => updateDraft(index, { comment: event.target.value })}
              placeholder="Comment (optional)"
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      {isDeclining ? (
        <div className="space-y-2 rounded-md border border-border p-4">
          <label htmlFor="declineReason" className="block text-sm font-medium text-foreground">
            Reason for declining <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="declineReason"
            rows={2}
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeclining(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
            >
              Back
            </button>
            <button
              type="button"
              disabled={decline.isPending}
              onClick={() => void handleDecline()}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
            >
              {decline.isPending ? 'Declining…' : 'Confirm decline'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between">
          {/* Declining is legitimate and recorded, not left pending forever. */}
          <button
            type="button"
            onClick={() => setIsDeclining(true)}
            className="text-sm text-muted-foreground underline"
          >
            I would rather not give feedback
          </button>
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => void handleSubmit()}
            className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-accent-on disabled:opacity-50"
          >
            {submit.isPending ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      )}
    </div>
  );
}
