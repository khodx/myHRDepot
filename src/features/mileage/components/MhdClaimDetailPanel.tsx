import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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

const TEXTAREA_CLASSES =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

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
    return <p className="text-sm text-muted-foreground">Loading claim…</p>;
  }

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {claim.referenceId}
            <span className="ml-3 align-middle">
              <MhdClaimStatusBadge status={claim.status} />
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {claim.personDisplayName} · {claim.periodStart} — {claim.periodEnd}
          </p>
        </div>
        <Button variant="secondary" className="px-3 py-1.5" onClick={onClose}>
          Close
        </Button>
      </header>

      {!isStamped ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This claim has not been approved, so nothing on it has been priced yet. Each line is
          stamped at approval against the rate in force on that line's own trip date — a claim
          spanning a rate revision will not settle at any single rate.
        </div>
      ) : null}

      <MhdTable>
        <thead>
          <tr>
            <MhdTh>#</MhdTh>
            <MhdTh>Trip date</MhdTh>
            <MhdTh className="text-right">Miles</MhdTh>
            <MhdTh className="text-right">IRS rate</MhdTh>
            <MhdTh className="text-right">Company rate</MhdTh>
            <MhdTh className="text-right">Amount</MhdTh>
            <MhdTh>Priced from</MhdTh>
          </tr>
        </thead>
        <tbody>
          {claim.lines.map((line) => (
            <MhdTr key={line.lineNumber}>
              <MhdTd className="tabular-nums">{line.lineNumber}</MhdTd>
              <MhdTd className="whitespace-nowrap">{line.tripDate}</MhdTd>
              <MhdTd className="text-right tabular-nums">{milesFormatter.format(line.miles)}</MhdTd>
              <MhdTd className="text-right tabular-nums">
                {line.irsRate == null ? (
                  <span className="text-xs text-muted-foreground">unstamped</span>
                ) : (
                  rateFormatter.format(line.irsRate)
                )}
              </MhdTd>
              <MhdTd className="text-right tabular-nums">
                {line.companyRate == null ? (
                  <span className="text-xs text-muted-foreground">unstamped</span>
                ) : (
                  <>
                    {rateFormatter.format(line.companyRate)}
                    {line.irsRate != null && line.companyRate > line.irsRate ? (
                      <span className="ml-2 text-xs font-medium text-amber-700">above IRS</span>
                    ) : null}
                  </>
                )}
              </MhdTd>
              <MhdTd className="text-right tabular-nums">
                {line.companyAmount == null ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  currencyFormatter.format(line.companyAmount)
                )}
              </MhdTd>
              <MhdTd className="whitespace-nowrap text-muted-foreground">
                {/*
                  The citation, on the line rather than in a footnote. Without
                  the notice number the stamped figure cannot be checked
                  against anything.
                */}
                {line.noticeNumber ?? '—'}
                {line.rateReference ? (
                  <span className="ml-2 text-xs text-muted-foreground">{line.rateReference}</span>
                ) : null}
              </MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total miles</p>
          <p className="mt-1 text-sm tabular-nums text-foreground">
            {claim.totalMiles == null ? '—' : milesFormatter.format(claim.totalMiles)}
          </p>
        </div>
        <div className="rounded-md border border-border px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">At the IRS rate</p>
          <p className="mt-1 text-sm tabular-nums text-foreground">
            {claim.totalIrsAmount == null ? '—' : currencyFormatter.format(claim.totalIrsAmount)}
          </p>
        </div>
        <div className="rounded-md border border-border px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Company reimbursement
          </p>
          <p className="mt-1 text-sm tabular-nums text-foreground">
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
          <strong>Taxable excess {currencyFormatter.format(claim.taxableExcess)}.</strong> The
          company rate exceeds the IRS rate on this claim, and reimbursement above the IRS rate is
          reportable wages.
        </div>
      ) : null}

      {claim.decisionNote ? (
        <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
          <span className="font-medium">Decision note:</span> {claim.decisionNote}
        </div>
      ) : null}

      {claim.exportedAt ? (
        <p className="text-xs text-muted-foreground">
          Exported {new Date(claim.exportedAt).toLocaleDateString()}.
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onSubmitClaim && claim.status === 'DRAFT' ? (
          <Button
            disabled={isSubmitting || claim.lines.length === 0}
            onClick={() => void onSubmitClaim(claim.id)}
          >
            Submit for approval
          </Button>
        ) : null}

        {onCancelClaim && (claim.status === 'DRAFT' || claim.status === 'SUBMITTED') ? (
          <Button
            variant="secondary"
            onClick={() => {
              setIsCancelling((open) => !open);
              setCancelError(null);
            }}
          >
            Cancel claim
          </Button>
        ) : null}

        {isPrivileged && onDecide && claim.status === 'SUBMITTED' ? (
          <Button variant="secondary" onClick={() => setIsDeciding((open) => !open)}>
            Decide
          </Button>
        ) : null}
      </div>

      {isCancelling && onCancelClaim ? (
        <div className="space-y-2 rounded-md border border-border bg-muted p-3">
          <label htmlFor="cancel-reason" className="block text-sm font-medium text-foreground">
            Reason for cancelling (required)
          </label>
          <p className="text-xs text-muted-foreground">
            Cancelling releases every trip on this claim back to the unclaimed pool. Nothing is
            deleted.
          </p>
          <textarea
            id="cancel-reason"
            rows={2}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            className={TEXTAREA_CLASSES}
          />
          {cancelError ? <p className="text-xs text-rose-600">{cancelError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5"
              onClick={() => setIsCancelling(false)}
            >
              Keep claim
            </Button>
            <Button
              className="px-3 py-1.5"
              disabled={isSubmitting}
              onClick={() => void submitCancel()}
            >
              {isSubmitting ? 'Cancelling…' : 'Cancel claim'}
            </Button>
          </div>
        </div>
      ) : null}

      {isDeciding && isPrivileged && onDecide ? (
        <form
          onSubmit={handleSubmit(submitDecision)}
          className="space-y-3 rounded-md border border-border bg-muted p-3"
        >
          <input type="hidden" {...register('claimId')} />

          <div>
            <label htmlFor="decision" className="block text-sm font-medium text-foreground">
              Outcome
            </label>
            <select
              id="decision"
              {...register('decision')}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="APPROVED">Approve — price and stamp every line</option>
              <option value="REJECTED">Reject — release the trips to be reclaimed</option>
            </select>
          </div>

          <div>
            <label htmlFor="decisionNote" className="block text-sm font-medium text-foreground">
              Note{' '}
              <span className="font-normal text-muted-foreground">
                {decision === 'REJECTED' ? '(required)' : '(optional)'}
              </span>
            </label>
            <textarea
              id="decisionNote"
              rows={2}
              {...register('decisionNote')}
              className={`mt-1 ${TEXTAREA_CLASSES}`}
            />
            {errors.decisionNote ? (
              <p className="mt-1 text-xs text-rose-600">{errors.decisionNote.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5"
              onClick={() => setIsDeciding(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="px-3 py-1.5" disabled={isSubmitting}>
              {isSubmitting ? 'Recording…' : 'Record decision'}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
