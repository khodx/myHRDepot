import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { mhdClaimDecisionSchema, type MhdClaimDecisionFormValues } from '../Schemas';
import { type MhdMileageClaimDetail } from '../Types';
import { MhdClaimStatusBadge } from './MhdClaimStatusBadge';

interface Props {
  claim: MhdMileageClaimDetail;
  /** Only a privileged viewer sees the decision controls. */
  isPrivileged: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmitClaim?: (claimId: string) => Promise<void>;
  onDecide?: (values: MhdClaimDecisionFormValues) => Promise<void>;
  onCancelClaim?: (input: { claimId: string; reason: string }) => Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
});

/** Rates carry more significant digits than money; never round one to cents. */
const rateFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
});

const milesFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * One claim, line by line.
 *
 * Each line cites the registry row it was priced from. That is the whole point
 * of the dual-rate stamp: years later somebody has to be able to say why a
 * particular line paid what it paid, and "the rate at the time" is not an answer
 * unless the row and its notice number travel with the line.
 *
 * Before approval the lines carry no rates at all, and this panel says so rather
 * than rendering zeros. A moving number must never be presented as a settled
 * one.
 */
export function MhdClaimDetailPanel({
  claim,
  isPrivileged,
  isLoading = false,
  isSubmitting = false,
  onClose,
  onSubmitClaim,
  onDecide,
  onCancelClaim,
}: Props) {
  const [isDeciding, setIsDeciding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MhdClaimDecisionFormValues>({
    resolver: zodResolver(mhdClaimDecisionSchema),
    defaultValues: {
      claimId: claim.id,
      decision: 'APPROVED',
      decisionNote: null,
    },
  });

  const decision = useWatch({ control, name: 'decision' });

  const isStamped = claim.status === 'APPROVED' || claim.status === 'EXPORTED';
  const hasExcess = claim.taxableExcess > 0;

  async function submitDecision(values: MhdClaimDecisionFormValues) {
    if (!onDecide) return;
    await onDecide(values);
    reset();
    setIsDeciding(false);
  }

  async function submitCancel() {
    if (!onCancelClaim) return;
    if (!cancelReason.trim()) {
      setCancelError('A reason is required to cancel a claim.');
      return;
    }
    setCancelError(null);
    await onCancelClaim({ claimId: claim.id, reason: cancelReason.trim() });
    setCancelReason('');
    setIsCancelling(false);
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading claim…</p>;
  }

  return (
    <section className="space-y-6 rounded-md border border-neutral-200 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            {claim.referenceId}
            <span className="ml-3 align-middle">
              <MhdClaimStatusBadge status={claim.status} />
            </span>
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {claim.personDisplayName} · {claim.periodStart} — {claim.periodEnd}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
        >
          Close
        </button>
      </header>

      {!isStamped ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This claim has not been approved, so nothing on it has been priced yet. Each line is
          stamped at approval against the rate in force on that line's own trip date — a claim
          spanning a rate revision will not settle at any single rate.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-4 font-medium">#</th>
              <th className="py-2 pr-4 font-medium">Trip date</th>
              <th className="py-2 pr-4 text-right font-medium">Miles</th>
              <th className="py-2 pr-4 text-right font-medium">IRS rate</th>
              <th className="py-2 pr-4 text-right font-medium">Company rate</th>
              <th className="py-2 pr-4 text-right font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Priced from</th>
            </tr>
          </thead>
          <tbody>
            {claim.lines.map((line) => (
              <tr key={line.lineNumber} className="border-b border-neutral-100 text-neutral-800">
                <td className="py-2 pr-4 tabular-nums">{line.lineNumber}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{line.tripDate}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {milesFormatter.format(line.miles)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {line.irsRate == null ? (
                    <span className="text-xs text-neutral-500">unstamped</span>
                  ) : (
                    rateFormatter.format(line.irsRate)
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {line.companyRate == null ? (
                    <span className="text-xs text-neutral-500">unstamped</span>
                  ) : (
                    <>
                      {rateFormatter.format(line.companyRate)}
                      {line.irsRate != null && line.companyRate > line.irsRate ? (
                        <span className="ml-2 text-xs font-medium text-amber-700">above IRS</span>
                      ) : null}
                    </>
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {line.companyAmount == null ? (
                    <span className="text-xs text-neutral-500">—</span>
                  ) : (
                    currencyFormatter.format(line.companyAmount)
                  )}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                  {/*
                    The citation, on the line rather than in a footnote. Without
                    the notice number the stamped figure cannot be checked
                    against anything.
                  */}
                  {line.noticeNumber ?? '—'}
                  {line.rateReference ? (
                    <span className="ml-2 text-xs text-neutral-500">{line.rateReference}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-200 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total miles</p>
          <p className="mt-1 text-sm tabular-nums text-neutral-900">
            {claim.totalMiles == null ? '—' : milesFormatter.format(claim.totalMiles)}
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">At the IRS rate</p>
          <p className="mt-1 text-sm tabular-nums text-neutral-900">
            {claim.totalIrsAmount == null ? '—' : currencyFormatter.format(claim.totalIrsAmount)}
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Company reimbursement</p>
          <p className="mt-1 text-sm tabular-nums text-neutral-900">
            {claim.totalCompanyAmount == null
              ? '—'
              : currencyFormatter.format(claim.totalCompanyAmount)}
          </p>
        </div>
      </div>

      {/*
        Surfaced, never hidden and never blocked. Paying above the IRS business
        rate is lawful; the excess is simply reportable wages, and payroll needs
        the figure rather than a warning.
      */}
      {hasExcess ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>
            Taxable excess {currencyFormatter.format(claim.taxableExcess)}.
          </strong>{' '}
          The company rate exceeds the IRS rate on this claim, and reimbursement above the IRS rate
          is reportable wages.
        </div>
      ) : null}

      {claim.decisionNote ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          <span className="font-medium">Decision note:</span> {claim.decisionNote}
        </div>
      ) : null}

      {claim.exportedAt ? (
        <p className="text-xs text-neutral-500">
          Exported {new Date(claim.exportedAt).toLocaleDateString()}.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onSubmitClaim && claim.status === 'DRAFT' ? (
          <button
            type="button"
            disabled={isSubmitting || claim.lines.length === 0}
            onClick={() => void onSubmitClaim(claim.id)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Submit for approval
          </button>
        ) : null}

        {onCancelClaim && (claim.status === 'DRAFT' || claim.status === 'SUBMITTED') ? (
          <button
            type="button"
            onClick={() => {
              setIsCancelling((open) => !open);
              setCancelError(null);
            }}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
          >
            Cancel claim
          </button>
        ) : null}

        {isPrivileged && onDecide && claim.status === 'SUBMITTED' ? (
          <button
            type="button"
            onClick={() => setIsDeciding((open) => !open)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
          >
            Decide
          </button>
        ) : null}
      </div>

      {isCancelling && onCancelClaim ? (
        <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <label htmlFor="cancel-reason" className="block text-sm font-medium text-neutral-700">
            Reason for cancelling (required)
          </label>
          <p className="text-xs text-neutral-600">
            Cancelling releases every trip on this claim back to the unclaimed pool. Nothing is
            deleted.
          </p>
          <textarea
            id="cancel-reason"
            rows={2}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {cancelError ? <p className="text-xs text-rose-600">{cancelError}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCancelling(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Keep claim
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitCancel()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Cancelling…' : 'Cancel claim'}
            </button>
          </div>
        </div>
      ) : null}

      {isDeciding && isPrivileged && onDecide ? (
        <form
          onSubmit={handleSubmit(submitDecision)}
          className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3"
        >
          <input type="hidden" {...register('claimId')} />

          <div>
            <label htmlFor="decision" className="block text-sm font-medium text-neutral-700">
              Outcome
            </label>
            <select
              id="decision"
              {...register('decision')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="APPROVED">Approve — price and stamp every line</option>
              <option value="REJECTED">Reject — release the trips to be reclaimed</option>
            </select>
          </div>

          <div>
            <label htmlFor="decisionNote" className="block text-sm font-medium text-neutral-700">
              Note{' '}
              <span className="font-normal text-neutral-500">
                {decision === 'REJECTED' ? '(required)' : '(optional)'}
              </span>
            </label>
            <textarea
              id="decisionNote"
              rows={2}
              {...register('decisionNote')}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {errors.decisionNote ? (
              <p className="mt-1 text-xs text-rose-600">{errors.decisionNote.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeciding(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Recording…' : 'Record decision'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
