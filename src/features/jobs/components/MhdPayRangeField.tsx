import { mhdFormatPayRange, type MhdJob } from '../Types';

interface Props {
  job: Pick<MhdJob, 'payMin' | 'payMax' | 'payPeriod'>;
  /**
   * Whether this viewer is Platform Admin or HR Partner. Passed from the route
   * rather than inferred from the row — see the note below on why the row alone
   * cannot answer it.
   */
  canSeePay: boolean;
  onEdit?: () => void;
}

/**
 * Displays a job's pay range.
 *
 * The server nulls `payMin`, `payMax` and `payPeriod` together for anyone who
 * is not Platform Admin or HR Partner, so the row alone cannot distinguish
 * "you may not see this" from "no range has been set". That ambiguity is
 * deliberate — the data genuinely never reaches an unprivileged client — but it
 * means the component needs `canSeePay` from the route to word itself honestly.
 *
 * Getting this wrong in the harmless direction (showing "not set" to someone who
 * is merely masked) is misleading; getting it wrong the other way would imply a
 * range exists to someone who cannot see it. Hence two distinct messages.
 */
export function MhdPayRangeField({ job, canSeePay, onEdit }: Props) {
  if (!canSeePay) {
    return (
      <div className="text-sm text-muted-foreground">
        <span className="block text-xs uppercase tracking-wide text-muted-foreground">Pay range</span>
        <span className="italic">Not available to your role</span>
      </div>
    );
  }

  const formatted = mhdFormatPayRange(job);

  return (
    <div className="text-sm">
      <span className="block text-xs uppercase tracking-wide text-muted-foreground">Pay range</span>
      {formatted ? (
        <span className="font-medium text-foreground">{formatted}</span>
      ) : (
        <span className="text-muted-foreground">Not set</span>
      )}
      {onEdit ? (
        <button type="button" onClick={onEdit} className="ml-3 text-xs font-medium text-accent hover:text-accent-hover">
          {formatted ? 'Edit' : 'Set range'}
        </button>
      ) : null}
      {/*
        Pay-transparency law in California and a growing number of other states
        requires the posted range to be what the employer reasonably expects to
        pay — not market data. Saying so here is cheaper than discovering it
        during a posting.
      */}
      <p className="mt-1 text-xs text-muted-foreground">
        This is the range you expect to pay on hire. Several states require it in job postings.
      </p>
    </div>
  );
}
