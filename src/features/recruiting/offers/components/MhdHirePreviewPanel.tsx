import { useMhdHirePayload } from '../Hook';
import {
  mhdFormatOnboardingRecommendation,
  type MhdHirePayload,
  type MhdOnboardingRecommendation,
} from '../Types';

interface Props {
  applicationId: string;
}

// The mapped 3-way recommendation, coloured by disposition. HIRE reads green,
// HOLD amber, NO_HIRE rose. This only RENDERS the server-mapped value (the 4->3
// collapse happens in the RPC); never re-map on the client.
const RECOMMENDATION_STYLES: Record<MhdOnboardingRecommendation, string> = {
  HIRE: 'bg-emerald-100 text-emerald-800',
  HOLD: 'bg-amber-100 text-amber-800',
  NO_HIRE: 'bg-rose-100 text-rose-800',
};

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

/**
 * "What onboarding will receive" — the read-only bridge that renders exactly what
 * the onboarding feed writes at the handoff (`hire_payload`): the offer terms, the
 * server-mapped 3-way recommendation, and the 1-5 rating. It lets a recruiter
 * preview the handoff before acceptance and confirm it after. It is a mirror of
 * the feed, not an input — no actions, no editing.
 */
export function MhdHirePreviewPanel({ applicationId }: Props) {
  const payload = useMhdHirePayload(applicationId);

  if (payload.isLoading) {
    return <p className="text-sm text-neutral-500">Loading onboarding preview…</p>;
  }
  if (payload.isError) {
    return (
      <p className="text-sm text-rose-600">
        {payload.error instanceof Error
          ? payload.error.message
          : 'Could not load the onboarding preview.'}
      </p>
    );
  }
  if (!payload.data) {
    return <p className="text-sm text-neutral-500">No hire payload yet.</p>;
  }

  const p: MhdHirePayload = payload.data;
  const salaryText =
    p.baseSalary == null
      ? '—'
      : p.baseSalary.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  const scoreText = p.overallScore == null ? '—' : p.overallScore.toFixed(2);
  const ratingText = p.onboardingOverallRating == null ? '—' : `${p.onboardingOverallRating} / 5`;
  const recommendationStyle =
    p.onboardingRecommendation == null
      ? 'bg-neutral-100 text-neutral-700'
      : RECOMMENDATION_STYLES[p.onboardingRecommendation] ?? 'bg-neutral-100 text-neutral-700';

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 p-4">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">What onboarding will receive</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          A read-only preview of the offer terms and evaluation the handoff feeds into onboarding —
          the recommendation and score are mapped for the onboarding record.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-neutral-900">{p.personDisplayName}</p>
          <p className="text-xs text-neutral-500">
            {p.offerJobTitle} · {p.requisitionTitle}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${recommendationStyle}`}
        >
          {mhdFormatOnboardingRecommendation(p.onboardingRecommendation)}
        </span>
      </div>

      <dl className="divide-y divide-neutral-100 rounded-md border border-neutral-200 px-4 py-2">
        <PreviewRow label="Start date" value={p.startDate ?? '—'} />
        <PreviewRow label="Base salary" value={salaryText} />
        <PreviewRow label="Pay frequency" value={p.payFrequency ?? '—'} />
        <PreviewRow label="Employment type" value={p.employmentType ?? '—'} />
        <PreviewRow label="Reporting manager" value={p.reportingManagerName ?? '—'} />
        <PreviewRow label="Offer expires" value={p.offerExpirationDate ?? '—'} />
        <PreviewRow label="Evaluation score" value={scoreText} />
        <PreviewRow label="Onboarding rating" value={ratingText} />
        <PreviewRow
          label="Source recommendation"
          value={p.evaluationRecommendation ?? '—'}
        />
      </dl>

      {p.evaluationSummary ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500">Evaluation summary</p>
          <p className="mt-0.5 text-sm text-neutral-700">{p.evaluationSummary}</p>
        </div>
      ) : null}
    </section>
  );
}
