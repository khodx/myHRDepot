import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
    control,
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
          <h2 className="text-base font-semibold text-foreground">IRS rate registry</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Effective-dated federal rates with the publication each one came from. A proposed rate
            prices nothing until a person confirms it.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setIsProposalOpen((open) => !open)}>
            {isProposalOpen ? 'Close' : 'Propose a rate'}
          </Button>
        ) : null}
      </header>

      <MhdCard className="flex flex-wrap gap-3">
        <MhdFilterSelect
          label="Category"
          value={filters.category ?? 'ALL'}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              category: event.target.value as MhdMileageRateFilters['category'],
            })
          }
        >
          <option value="ALL">All categories</option>
          {MHD_MILEAGE_RATE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {mhdFormatRateCategory(category)}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Status"
          value={filters.status ?? 'ALL'}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as MhdMileageRateFilters['status'],
            })
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_MILEAGE_RATE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdCard>

      {canManage && isProposalOpen ? (
        <form
          onSubmit={handleSubmit(submitProposal)}
          className="space-y-4 rounded-md border border-border bg-muted p-4"
        >
          <p className="text-sm text-foreground">
            The citation is required here, at proposal, rather than at confirmation — the confirmer
            needs something to check the figure against.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                id="category"
                {...register('category')}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {MHD_MILEAGE_RATE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {mhdFormatRateCategory(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ratePerMile" className="block text-sm font-medium text-foreground">
                Rate per mile
              </label>
              <input
                id="ratePerMile"
                type="number"
                step="0.001"
                {...register('ratePerMile', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              {errors.ratePerMile ? (
                <p className="mt-1 text-xs text-rose-600">{errors.ratePerMile.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="effectiveFrom" className="block text-sm font-medium text-foreground">
                Effective from
              </label>
              <Controller
                name="effectiveFrom"
                control={control}
                render={({ field }) => (
                  <MhdDateField
                    id="effectiveFrom"
                    className="mt-1 w-full"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.effectiveFrom ? (
                <p className="mt-1 text-xs text-rose-600">{errors.effectiveFrom.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="noticeNumber" className="block text-sm font-medium text-foreground">
                Notice or bulletin number
              </label>
              <input
                id="noticeNumber"
                type="text"
                {...register('noticeNumber')}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              {errors.noticeNumber ? (
                <p className="mt-1 text-xs text-rose-600">{errors.noticeNumber.message}</p>
              ) : null}
              {/*
                The published pages contradict each other and mid-year revisions
                are not rare, so the notice number is the only stable identity a
                figure has.
              */}
              <p className="mt-1 text-xs text-muted-foreground">
                The identity of the publication this figure came from.
              </p>
            </div>

            <div>
              <label htmlFor="sourceUrl" className="block text-sm font-medium text-foreground">
                Source URL
              </label>
              <input
                id="sourceUrl"
                type="url"
                {...register('sourceUrl')}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                className="block text-sm font-medium text-foreground"
              >
                Document date <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Controller
                name="sourceDocumentDate"
                control={control}
                render={({ field }) => (
                  <MhdDateField
                    id="sourceDocumentDate"
                    className="mt-1 w-full"
                    value={field.value ?? ''}
                    onChange={(nextValue) => field.onChange(nextValue || null)}
                  />
                )}
              />
              {errors.sourceDocumentDate ? (
                <p className="mt-1 text-xs text-rose-600">{errors.sourceDocumentDate.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="notes"
                type="text"
                {...register('notes')}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setIsProposalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProposing}>
              {isProposing ? 'Proposing…' : 'Propose rate'}
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading rates…</p>
      ) : rates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rates on record for this filter.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Category</MhdTh>
                <MhdTh className="text-right">Rate / mile</MhdTh>
                <MhdTh>In force</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Notice</MhdTh>
                <MhdTh>Source</MhdTh>
                <MhdTh>Confirmed</MhdTh>
                <MhdTh>Entered by</MhdTh>
                {canManage ? <MhdTh /> : null}
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <MhdTr
                  key={rate.id}
                  className={mhdIsRateCurrent(rate) ? 'bg-emerald-50/40' : undefined}
                >
                  <MhdTd className="whitespace-nowrap">
                    {mhdFormatRateCategory(rate.category)}
                  </MhdTd>
                  <MhdTd className="text-right tabular-nums">
                    {rateFormatter.format(rate.ratePerMile)}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap">
                    {rate.effectiveFrom} — {rate.effectiveTo ?? 'open'}
                    {mhdIsRateCurrent(rate) ? (
                      <span className="ml-2 text-xs font-medium text-emerald-700">current</span>
                    ) : null}
                  </MhdTd>
                  <MhdTd>
                    <MhdRateStatusBadge status={rate.status} />
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap">{rate.noticeNumber ?? '—'}</MhdTd>
                  <MhdTd>
                    {rate.sourceUrl ? (
                      <a
                        href={rate.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-accent hover:text-accent-hover"
                      >
                        {rate.sourceDocumentDate ?? 'Open source'}
                      </a>
                    ) : (
                      '—'
                    )}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap">
                    {rate.confirmedAt ? new Date(rate.confirmedAt).toLocaleDateString() : '—'}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {mhdFormatFetchSource(rate.fetchSource)}
                    {rate.retrievedAt
                      ? ` · ${new Date(rate.retrievedAt).toLocaleDateString()}`
                      : ''}
                  </MhdTd>
                  {canManage ? (
                    <MhdTd className="text-right">
                      {/*
                        Confirmation is the only path from PROPOSED to ACTIVE,
                        and it supersedes the incumbent in the same transaction.
                        There is deliberately no automatic activation.
                      */}
                      {rate.status === 'PROPOSED' ? (
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5"
                          disabled={isConfirming}
                          onClick={() => void onConfirm(rate.id)}
                        >
                          Confirm
                        </Button>
                      ) : null}
                    </MhdTd>
                  ) : null}
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {rates.some((rate) => rate.notes) ? (
        <div className="text-xs text-muted-foreground">
          <h3 className="font-medium text-foreground">Notes</h3>
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
