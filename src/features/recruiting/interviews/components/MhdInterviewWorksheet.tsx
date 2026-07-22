import { useEffect, useState } from 'react';
import { useMhdInterviewWorksheet, useMhdSubmitInterviewResponses } from '../Hook';
import type { MhdInterviewResponseDraft } from '../Types';
import { MhdComplianceFlag } from './MhdComplianceFlag';

interface Props {
  interviewId: string;
  /**
   * Whether the viewer may submit. The submit RPC gates on
   * `mhd_interview_can_access_interview` (the assigned interviewer OR a recruiter)
   * and re-checks regardless; this only governs the affordance. The worksheet READ
   * is gated the same way, so an interviewer only ever loads their own scorecard.
   */
  canSubmit: boolean;
  onSubmitted?: () => void;
}

// One editable answer, keyed to a guide item. Held in local controlled state
// because the field set is DYNAMIC — one input per guide item, shaped by
// `response_type`, unknown until `get_worksheet` returns — which no fixed zod
// object schema can describe. Seeded from the prefilled `existing_*` values.
interface AnswerDraft {
  rating: number | null;
  responseBool: boolean | null;
  responseText: string;
}

/**
 * The interviewer's scorecard.
 *
 * Renders ONE input per guide item, keyed by `response_type` — a 1–5 rating, a
 * yes/no, or a textarea — prefilled from any prior answer (`existing_*`). Submit
 * builds the jsonb `MhdInterviewResponseDraft[]` (`{guide_item_id, rating |
 * response_bool | response_text}`) and calls `submit_responses`, which SNAPSHOTS
 * each question and marks the interview COMPLETED.
 *
 * LOAD-BEARING: every item surfaces its compliance flag + guidance INLINE, right
 * where the question is asked, so an interviewer never puts a CAUTION question to a
 * candidate without seeing why to avoid or rephrase it. Do not hide it behind a
 * hover or a separate panel — the whole point is that it rides with the question.
 */
export function MhdInterviewWorksheet({ interviewId, canSubmit, onSubmitted }: Props) {
  const worksheet = useMhdInterviewWorksheet(interviewId);
  const submit = useMhdSubmitInterviewResponses();

  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({});

  // Seed the local answers from the fetched worksheet (prefilling prior responses).
  useEffect(() => {
    if (!worksheet.data) return;
    const seeded: Record<string, AnswerDraft> = {};
    for (const item of worksheet.data) {
      seeded[item.guideItemId] = {
        rating: item.existingRating,
        responseBool: item.existingBool,
        responseText: item.existingText ?? '',
      };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: seed local answer drafts from the fetched worksheet
    setAnswers(seeded);
  }, [worksheet.data]);

  function updateAnswer(guideItemId: string, patch: Partial<AnswerDraft>) {
    setAnswers((prev) => ({
      ...prev,
      [guideItemId]: {
        rating: prev[guideItemId]?.rating ?? null,
        responseBool: prev[guideItemId]?.responseBool ?? null,
        responseText: prev[guideItemId]?.responseText ?? '',
        ...patch,
      },
    }));
  }

  async function handleSubmit() {
    if (!worksheet.data) return;
    // Build the drafts from each item, keeping only the field relevant to its type.
    // The service maps these to the snake_case jsonb array the RPC expects.
    const drafts: MhdInterviewResponseDraft[] = worksheet.data.map((item) => {
      const answer = answers[item.guideItemId];
      switch (item.responseType) {
        case 'RATING_1_5':
          return { guideItemId: item.guideItemId, rating: answer?.rating ?? null };
        case 'YES_NO':
          return { guideItemId: item.guideItemId, responseBool: answer?.responseBool ?? null };
        case 'TEXT':
        default:
          return { guideItemId: item.guideItemId, responseText: answer?.responseText ?? null };
      }
    });
    await submit.mutateAsync({ interviewId, responses: drafts });
    onSubmitted?.();
  }

  if (worksheet.isLoading) {
    return <p className="text-sm text-neutral-500">Loading worksheet…</p>;
  }

  if (worksheet.isError) {
    return (
      <p className="text-sm text-rose-600">
        {worksheet.error instanceof Error
          ? worksheet.error.message
          : 'Unable to load this worksheet. You may not be assigned to this interview.'}
      </p>
    );
  }

  if ((worksheet.data ?? []).length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        This interview&apos;s guide has no questions yet.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-neutral-900">Scorecard</h2>

      <ol className="space-y-4">
        {(worksheet.data ?? []).map((item, index) => {
          const answer = answers[item.guideItemId];
          return (
            <li
              key={item.guideItemId}
              className="space-y-3 rounded-md border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {index + 1}. {item.questionText}
                  </p>
                  {item.competencyName ? (
                    <span className="inline-flex rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      {item.competencyName}
                    </span>
                  ) : null}
                </div>
                {/* Compliance flag + guidance, inline with the question (load-bearing).
                    A flagged item (CAUTION / REVIEW) shows its guidance beneath the
                    badge so the interviewer sees WHY it is flagged; APPROVED shows
                    the badge alone, and a null guidance shows the badge alone too. */}
                <MhdComplianceFlag
                  status={item.complianceStatus}
                  guidance={item.complianceGuidance}
                />
              </div>

              {item.responseType === 'RATING_1_5' ? (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={!canSubmit}
                      onClick={() => updateAnswer(item.guideItemId, { rating: value })}
                      className={`h-9 w-9 rounded-md border text-sm font-medium disabled:opacity-50 ${
                        answer?.rating === value
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                  {answer?.rating != null ? (
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={() => updateAnswer(item.guideItemId, { rating: null })}
                      className="ml-2 text-xs text-neutral-500 underline disabled:opacity-50"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              ) : null}

              {item.responseType === 'YES_NO' ? (
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      disabled={!canSubmit}
                      onClick={() =>
                        updateAnswer(item.guideItemId, { responseBool: option.value })
                      }
                      className={`rounded-md border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
                        answer?.responseBool === option.value
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  {answer?.responseBool != null ? (
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={() => updateAnswer(item.guideItemId, { responseBool: null })}
                      className="ml-2 text-xs text-neutral-500 underline disabled:opacity-50"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              ) : null}

              {item.responseType === 'TEXT' ? (
                <textarea
                  rows={3}
                  disabled={!canSubmit}
                  value={answer?.responseText ?? ''}
                  onChange={(event) =>
                    updateAnswer(item.guideItemId, { responseText: event.target.value })
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {canSubmit ? (
        <div className="flex items-center justify-end gap-3">
          {submit.isError ? (
            <p className="text-xs text-rose-600">
              {submit.error instanceof Error ? submit.error.message : 'Unable to submit.'}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submit.isPending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submit.isPending ? 'Submitting…' : 'Submit scorecard'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          You are viewing this scorecard read-only. Only the assigned interviewer submits it.
        </p>
      )}
    </section>
  );
}
