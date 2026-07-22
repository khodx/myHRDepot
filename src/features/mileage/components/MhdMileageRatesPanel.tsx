import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { mhdRateProposalSchema, type MhdRateProposalFormValues } from '../Schemas';
import {
  MHD_MILEAGE_RATE_CATEGORIES,
  MHD_MILEAGE_RATE_STATUSES,
  mhdFormatFetchSource,
  mhdFormatRateCategory,
  mhdIsRateCurrent,
  type MhdMileageRate,
  type MhdMileageRateFilters,
} from '../Types';
import { MhdRateStatusBadge } from './MhdRateStatusBadge';

interface Props {
  rates: MhdMileageRate[];
  filters: MhdMileageRateFilters;
  onFiltersChange: (filters: MhdMileageRateFilters) => void;
  /** Platform Admin only. When false the panel is a read-only reference table. */
  canManage: boolean;
  isLoading?: boolean;
  isProposing?: boolean;
  isConfirming?: boolean;
  onPropose: (values: MhdRateProposalFormValues) => Promise<void>;
  onConfirm: (rateId: string) => Promise<void>;
}

/** Rates carry more significant digits than money; never round one to cents. */
const rateFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
});

/**
 * The IRS rate registry.
 *
 * The provenance columns are the table, not decoration on it. A rate with no
 * traceable citation is a number somebody typed, and the whole point of the
 * registry is that every figure which ever priced a reimbursement can be traced
 * back to the publication it came from — years later, by somebody who was not
 * there. So the notice number, the source link and the confirmation date sit in
 * the row itself rather than behind a tooltip or a detail drawer.
 *
 * Nothing here proposes a figure of its own. The form starts empty and stays
 * empty: any default, example or placeholder rate printed by this component
 * would be a second source of truth that nobody confirmed and nobody supersedes.
 */
export function MhdMileageRatesPanel({
  rates,
  filters,
  onFiltersChange,
  canManage,
  isLoading = false,
  isProposing = false,
  isConfirming = false,
  onPropose,
  onConfirm,
}: Props) {
  const [isProposalOpen, setIsProposalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MhdRateProposalFormValues>({
    resolver: zodResolver(mhdRateProposalSchema),
    defaultValues: {
      category: 'BUSINESS',
      effectiveFrom: '',
      sourceUrl: '',
      noticeNumber: '',
      sourceDocumentDate: null,
      notes: null,
    },
  });

  async function submitProposal(values: MhdRateProposalFormValues) {
    await onPropose(values);
    reset();
    setIsProposalOpen(false);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">IRS rate registry</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Effective-dated federal rates with the publication each one came from. A proposed rate
            prices nothing until a person confirms it.
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setIsProposalOpen((open) => !open)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
          >
            {isProposalOpen ? 'Close' : 'Propose a rate'}
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={filters.category ?? 'ALL'}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              category: event.target.value as MhdMileageRateFilters['category'],
            })
          }
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All categories</option>
          {MHD_MILEAGE_RATE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {mhdFormatRateCategory(category)}
            </option>
          ))}
        </select>

        <select
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as MhdMileageRateFilters['status'],
            })
          }
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All statuses</option>
          {MHD_MILEAGE_RATE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {canManage && isProposalOpen ? (
        <form
          onSubmit={handleSubmit(submitProposal)}
          className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50 p-4"
        >
          <p className="text-sm text-neutral-700">
            The citation is required here, at proposal, rather than at confirmation — the confirmer
            needs something to check the figure against.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
                Category
              </label>
              <select
                id="category"
                {...register('category')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {MHD_MILEAGE_RATE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {mhdFormatRateCategory(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ratePerMile" className="block text-sm font-medium text-neutral-700">
                Rate per mile
              </label>
              <input
                id="ratePerMile"
                type="number"
                step="0.001"
                {...register('ratePerMile', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {errors.ratePerMile ? (
                <p className="mt-1 text-xs text-rose-600">{errors.ratePerMile.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="effectiveFrom" className="block text-sm font-medium text-neutral-700">
                Effective from
              </label>
              <input
                id="effectiveFrom"
                type="date"
                {...register('effectiveFrom')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {errors.effectiveFrom ? (
                <p className="mt-1 text-xs text-rose-600">{errors.effectiveFrom.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="noticeNumber" className="block text-sm font-medium text-neutral-700">
                Notice or bulletin number
              </label>
              <input
                id="noticeNumber"
                type="text"
                {...register('noticeNumber')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {errors.noticeNumber ? (
                <p className="mt-1 text-xs text-rose-600">{errors.noticeNumber.message}</p>
              ) : null}
              {/*
                The published pages contradict each other and mid-year revisions
                are not rare, so the notice number is the only stable identity a
                figure has.
              */}
              <p className="mt-1 text-xs text-neutral-500">
                The identity of the publication this figure came from.
              </p>
            </div>

            <div>
              <label htmlFor="sourceUrl" className="block text-sm font-medium text-neutral-700">
                Source URL
              </label>
              <input
                id="sourceUrl"
                type="url"
                {...register('sourceUrl')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {errors.sourceUrl ? (
                <p className="mt-1 text-xs text-rose-600">{errors.sourceUrl.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sourceDocumentDate"
                className="block text-sm font-medium text-neutral-700"
              >
                Document date <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <input
                id="sourceDocumentDate"
                type="date"
                {...register('sourceDocumentDate')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {errors.sourceDocumentDate ? (
                <p className="mt-1 text-xs text-rose-600">{errors.sourceDocumentDate.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
                Notes <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <input
                id="notes"
                type="text"
                {...register('notes')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setIsProposalOpen(false);
              }}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProposing}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {isProposing ? 'Proposing…' : 'Propose rate'}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading rates…</p>
      ) : rates.length === 0 ? (
        <p className="text-sm text-neutral-500">No rates on record for this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 text-right font-medium">Rate / mile</th>
                <th className="py-2 pr-4 font-medium">In force</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Notice</th>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Confirmed</th>
                <th className="py-2 pr-4 font-medium">Entered by</th>
                {canManage ? <th className="py-2 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr
                  key={rate.id}
                  className={`border-b border-neutral-100 ${
                    mhdIsRateCurrent(rate) ? 'bg-emerald-50/40 text-neutral-900' : 'text-neutral-800'
                  }`}
                >
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {mhdFormatRateCategory(rate.category)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {rateFormatter.format(rate.ratePerMile)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {rate.effectiveFrom} — {rate.effectiveTo ?? 'open'}
                    {mhdIsRateCurrent(rate) ? (
                      <span className="ml-2 text-xs font-medium text-emerald-700">current</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4">
                    <MhdRateStatusBadge status={rate.status} />
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{rate.noticeNumber ?? '—'}</td>
                  <td className="py-2 pr-4">
                    {rate.sourceUrl ? (
                      <a
                        href={rate.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-blue-700 underline"
                      >
                        {rate.sourceDocumentDate ?? 'Open source'}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {rate.confirmedAt ? new Date(rate.confirmedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {mhdFormatFetchSource(rate.fetchSource)}
                    {rate.retrievedAt
                      ? ` · ${new Date(rate.retrievedAt).toLocaleDateString()}`
                      : ''}
                  </td>
                  {canManage ? (
                    <td className="py-2 text-right">
                      {/*
                        Confirmation is the only path from PROPOSED to ACTIVE,
                        and it supersedes the incumbent in the same transaction.
                        There is deliberately no automatic activation.
                      */}
                      {rate.status === 'PROPOSED' ? (
                        <button
                          type="button"
                          disabled={isConfirming}
                          onClick={() => void onConfirm(rate.id)}
                          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rates.some((rate) => rate.notes) ? (
        <div className="text-xs text-neutral-600">
          <h3 className="font-medium text-neutral-700">Notes</h3>
          <ul className="mt-1 space-y-1">
            {rates
              .filter((rate) => rate.notes)
              .map((rate) => (
                <li key={rate.id}>
                  {rate.referenceId} — {rate.notes}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
