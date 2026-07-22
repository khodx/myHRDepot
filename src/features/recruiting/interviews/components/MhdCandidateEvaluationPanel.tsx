import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useMhdFinalizeEvaluation,
  useMhdInterviewEvaluation,
  useMhdInterviewEvaluationRollup,
  useMhdInterviewEvaluationScore,
} from '../Hook';
import {
  mhdEvaluationFinalizeSchema,
  type MhdEvaluationFinalizeFormValues,
} from '../Schemas';
import {
  MHD_CANDIDATE_EVALUATION_STATUSES,
  MHD_INTERVIEW_RECOMMENDATIONS,
  mhdFormatEvaluationStatus,
  mhdFormatRecommendation,
} from '../Types';
import { MhdRecommendationBadge } from './MhdRecommendationBadge';

interface Props {
  applicationId: string;
  /** Whether the viewer may finalize (privileged). The RPC re-checks regardless. */
  canFinalize: boolean;
}

/**
 * The candidate evaluation — the competency-weighted rollup plus the recommendation.
 *
 * Reads `evaluation_rollup` (per-competency weighted average across all COMPLETED
 * interviews, rendered as bars) and `evaluation_overall_score` (the single weighted
 * score, shown prominently). The recommendation form calls `evaluation_finalize`;
 * `evaluation_get` shows the finalized decision.
 *
 * LOAD-BEARING: the overall score and the per-competency averages are DERIVED
 * server-side (Σ(weight·avg)/Σweight over the SNAPSHOTTED responses). They are read
 * from the RPCs and rendered verbatim — NEVER recomputed on the client, and never
 * averaged out of the rollup rows here. Editing the bank later cannot rewrite them
 * because the responses are snapshots. The weight column is the JD competency weight.
 */
export function MhdCandidateEvaluationPanel({ applicationId, canFinalize }: Props) {
  const rollup = useMhdInterviewEvaluationRollup(applicationId);
  const score = useMhdInterviewEvaluationScore(applicationId);
  const evaluation = useMhdInterviewEvaluation(applicationId);
  const finalize = useMhdFinalizeEvaluation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdEvaluationFinalizeFormValues>({
    resolver: zodResolver(mhdEvaluationFinalizeSchema),
    defaultValues: {
      applicationId,
      recommendation: 'HIRE',
      summary: '',
      status: 'FINAL',
    },
  });

  async function handleFinalize(values: MhdEvaluationFinalizeFormValues) {
    await finalize.mutateAsync({
      applicationId,
      recommendation: values.recommendation,
      summary: values.summary || null,
      status: values.status,
    });
  }

  const maxRating = 5; // the RATING_1_5 ceiling — the bar and score denominator.

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Candidate evaluation</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          A competency-weighted rollup of every completed interview&apos;s scorecard, using the job
          description&apos;s competency weights.
        </p>
      </div>

      {/* The prominent, DERIVED overall score. */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Overall weighted score</p>
        {score.isLoading ? (
          <p className="mt-1 text-sm text-neutral-500">Calculating…</p>
        ) : score.data == null ? (
          <p className="mt-1 text-sm text-neutral-500">
            No rated responses yet — the score appears once a scorecard is submitted.
          </p>
        ) : (
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {score.data.toFixed(2)}
            <span className="text-base font-normal text-neutral-500"> / {maxRating}</span>
          </p>
        )}
      </div>

      {/* Per-competency weighted bars. */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700">By competency</h3>
        {rollup.isLoading ? (
          <p className="text-sm text-neutral-500">Loading rollup…</p>
        ) : (rollup.data ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">
            No rated responses have been recorded across this application&apos;s interviews yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {(rollup.data ?? []).map((row) => {
              const pct = Math.round((row.avgRating / maxRating) * 100);
              return (
                <li key={row.competencyId ?? 'unweighted'}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700">
                      {row.competencyName ?? 'Unweighted'}
                      <span className="ml-2 text-xs text-neutral-400">
                        weight {row.weight} · {row.responseCount} rating
                        {row.responseCount === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="text-neutral-500">{row.avgRating.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* The finalized decision, if any. */}
      {evaluation.data ? (
        <div className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-700">Decision</h3>
              <MhdRecommendationBadge recommendation={evaluation.data.overallRecommendation} />
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {mhdFormatEvaluationStatus(evaluation.data.status)}
              </span>
            </div>
            <span className="font-mono text-xs text-neutral-400">
              {evaluation.data.referenceId}
            </span>
          </div>
          {evaluation.data.decisionSummary ? (
            <p className="mt-2 text-sm text-neutral-700">{evaluation.data.decisionSummary}</p>
          ) : null}
          {evaluation.data.decidedAt ? (
            <p className="mt-1 text-xs text-neutral-400">
              Decided {new Date(evaluation.data.decidedAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* The recommendation form (privileged). */}
      {canFinalize ? (
        <form
          onSubmit={handleSubmit(handleFinalize)}
          className="space-y-4 rounded-lg border border-neutral-200 p-4"
        >
          <h3 className="text-sm font-semibold text-neutral-900">
            {evaluation.data ? 'Update the recommendation' : 'Record a recommendation'}
          </h3>
          <input type="hidden" {...register('applicationId')} readOnly />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recommendation" className="block text-sm font-medium text-neutral-700">
                Recommendation
              </label>
              <select
                id="recommendation"
                {...register('recommendation')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_INTERVIEW_RECOMMENDATIONS.map((recommendation) => (
                  <option key={recommendation} value={recommendation}>
                    {mhdFormatRecommendation(recommendation)}
                  </option>
                ))}
              </select>
              {errors.recommendation ? (
                <p className="mt-1 text-xs text-rose-600">{errors.recommendation.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_CANDIDATE_EVALUATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {mhdFormatEvaluationStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-neutral-700">
              Decision summary <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              id="summary"
              rows={3}
              {...register('summary')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            {finalize.isError ? (
              <p className="text-xs text-rose-600">
                {finalize.error instanceof Error
                  ? finalize.error.message
                  : 'Unable to save the recommendation.'}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={finalize.isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {finalize.isPending ? 'Saving…' : 'Save recommendation'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
