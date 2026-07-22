import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  mhdCompanyRatePolicySchema,
  type MhdCompanyRatePolicyFormValues,
} from '../Schemas';
import {
  MHD_MILEAGE_RATE_MODES,
  mhdFormatRateMode,
  type MhdMileageEffectiveRate,
} from '../Types';

interface Props {
  companyId: string;
  /** What applies today: the company figure, the federal figure and the mode. */
  effectiveRate: MhdMileageEffectiveRate | null;
  onSubmit: (values: MhdCompanyRatePolicyFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/** Rates carry more significant digits than money; never round one to cents. */
const rateFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
});

/**
 * What the company chooses to pay, versioned by effective date.
 *
 * Tracking the IRS business rate is the default and the accountable-plan safe
 * harbour. A fixed rate is lawful and this form does not block it — but where it
 * sits above the federal figure the excess is reportable wages, so the
 * consequence is stated inline as the number is typed. The system's job is to
 * make that visible and computable, not to overrule a business decision.
 *
 * A new version never restates a settled claim: lines already stamped keep the
 * policy they were priced against.
 */
export function MhdCompanyRatePolicyForm({
  companyId,
  effectiveRate,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<MhdCompanyRatePolicyFormValues>({
    resolver: zodResolver(mhdCompanyRatePolicySchema),
    defaultValues: {
      companyId,
      effectiveFrom: '',
      rateMode: effectiveRate?.rateMode ?? 'TRACK_IRS_BUSINESS',
      fixedRatePerMile: null,
      policyNote: null,
    },
  });

  const rateMode = useWatch({ control, name: 'rateMode' });
  const fixedRate = useWatch({ control, name: 'fixedRatePerMile' });

  const isFixed = rateMode === 'FIXED';

  // The mode and the rate are paired by a database CHECK in both directions, so
  // a tracking policy carrying a leftover fixed rate is refused outright rather
  // than quietly ignored. Clearing it keeps the payload legal.
  useEffect(() => {
    if (!isFixed) {
      setValue('fixedRatePerMile', null, { shouldValidate: true });
    }
  }, [isFixed, setValue]);

  const irsRate = effectiveRate?.irsRate ?? null;
  const exceedsIrs =
    isFixed && irsRate != null && typeof fixedRate === 'number' && fixedRate > irsRate;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('companyId')} />

      <header>
        <h2 className="text-base font-semibold text-neutral-900">Company mileage rate</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {effectiveRate == null
            ? 'No policy is configured, so this company tracks the IRS business rate.'
            : `Currently ${mhdFormatRateMode(effectiveRate.rateMode).toLowerCase()}${
                effectiveRate.companyRate != null
                  ? ` at ${rateFormatter.format(effectiveRate.companyRate)} per mile`
                  : ''
              }.`}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rateMode" className="block text-sm font-medium text-neutral-700">
            Rate mode
          </label>
          <select
            id="rateMode"
            {...register('rateMode')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {MHD_MILEAGE_RATE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mhdFormatRateMode(mode)}
              </option>
            ))}
          </select>
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
          <p className="mt-1 text-xs text-neutral-500">
            The open policy version closes the day before this date. Claims already approved keep
            the rate they were stamped against.
          </p>
        </div>
      </div>

      {/*
        The fixed-rate input exists only under FIXED. Rendering it disabled under
        a tracking policy would invite the reader to believe some number here
        still applies; only one figure can be the one that governs.
      */}
      {isFixed ? (
        <div>
          <label htmlFor="fixedRatePerMile" className="block text-sm font-medium text-neutral-700">
            Fixed rate per mile
          </label>
          <input
            id="fixedRatePerMile"
            type="number"
            step="0.001"
            min={0}
            {...register('fixedRatePerMile', {
              setValueAs: (raw) => {
                if (raw === '' || raw == null) return null;
                const parsed = Number(raw);
                return Number.isFinite(parsed) ? parsed : null;
              },
            })}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-48"
          />
          {errors.fixedRatePerMile ? (
            <p className="mt-1 text-xs text-rose-600">{errors.fixedRatePerMile.message}</p>
          ) : null}
          {irsRate != null ? (
            <p className="mt-1 text-xs text-neutral-500">
              The IRS business rate in force today is {rateFormatter.format(irsRate)} per mile.
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-700">
              No confirmed IRS business rate covers today, so the excess cannot be computed until
              one is confirmed.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Reimbursement follows the confirmed IRS business rate on each trip's own date. Nothing
          paid under this mode is reportable wages.
        </div>
      )}

      {exceedsIrs ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>This rate is above the IRS business rate.</strong> That is allowed, and this form
          will save it. Everything paid above the IRS rate is reportable wages, and the excess will
          be shown on every claim priced under this policy so payroll has the figure.
        </div>
      ) : null}

      <div>
        <label htmlFor="policyNote" className="block text-sm font-medium text-neutral-700">
          Policy note <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="policyNote"
          rows={2}
          {...register('policyNote')}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save policy'}
        </button>
      </div>
    </form>
  );
}
