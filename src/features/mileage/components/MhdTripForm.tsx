import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { mhdTripFormSchema, type MhdTripFormValues } from '../Schemas';
import type { MhdMileageTrip } from '../Types';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  companyId: string;
  /** Empty for an employee recording their own trip — see `presetPersonId`. */
  people: PersonOption[];
  /** Fixes the traveller. An employee may only ever record against themselves. */
  presetPersonId?: string | null;
  /** Present when editing. A trip on a live claim is not editable — see below. */
  trip?: MhdMileageTrip | null;
  onSubmit: (values: MhdTripFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/** Empty numeric inputs must reach the schema as null, not as NaN. */
function optionalNumber(raw: unknown): number | null {
  if (raw === '' || raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Records or edits one trip.
 *
 * Two fields carry the module's weight and neither is optional. The business
 * purpose is the substantiation: a mileage log full of blanks is worth nothing
 * if it is ever examined, which is why it is required rather than encouraged.
 * The not-ordinary-commuting affirmation is a statement the recorder makes, not
 * a preference they set — commuting mileage is not reimbursable and the RPC
 * refuses the trip outright without it.
 *
 * The odometer pair is optional and is deliberately NOT reconciled against the
 * mileage. The two disagree honestly more often than not, and a form that
 * rejects the truth teaches people to adjust the readings until it passes.
 */
export function MhdTripForm({
  companyId,
  people,
  presetPersonId,
  trip,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MhdTripFormValues>({
    resolver: zodResolver(mhdTripFormSchema),
    defaultValues: {
      personId: trip?.personId ?? presetPersonId ?? '',
      tripDate: trip?.tripDate ?? new Date().toISOString().slice(0, 10),
      miles: trip?.miles,
      origin: trip?.origin ?? '',
      destination: trip?.destination ?? '',
      businessPurpose: trip?.businessPurpose ?? '',
      notOrdinaryCommuting: false,
      isRoundTrip: false,
      odometerStart: null,
      odometerEnd: null,
      commuteDeductionMiles: null,
      vehicleDescription: null,
      notes: null,
    },
  });

  const affirmed = useWatch({ control, name: 'notOrdinaryCommuting' });

  // A trip already sitting on a live claim is frozen: an edit would silently
  // restate a figure somebody is being paid against. Void and re-log instead.
  const isLocked =
    trip != null &&
    trip.claimId != null &&
    trip.claimStatus !== 'REJECTED' &&
    trip.claimStatus !== 'CANCELLED';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} readOnly />

      {isLocked ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This trip is on a live claim and cannot be edited. Void it and record a replacement if the
          record is wrong.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="personId" className="block text-sm font-medium text-foreground">
            Traveller
          </label>
          <select
            id="personId"
            {...register('personId')}
            disabled={Boolean(presetPersonId) || isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          >
            <option value="">Select an employee…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
          {errors.personId ? (
            <p className="mt-1 text-xs text-rose-600">{errors.personId.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="tripDate" className="block text-sm font-medium text-foreground">
            Date
          </label>
          <Controller
            name="tripDate"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="tripDate"
                disabled={isLocked}
                className="mt-1 w-full"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          {errors.tripDate ? (
            <p className="mt-1 text-xs text-rose-600">{errors.tripDate.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-foreground">
            From
          </label>
          <input
            id="origin"
            type="text"
            {...register('origin')}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
          {errors.origin ? (
            <p className="mt-1 text-xs text-rose-600">{errors.origin.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-foreground">
            To
          </label>
          <input
            id="destination"
            type="text"
            {...register('destination')}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
          {errors.destination ? (
            <p className="mt-1 text-xs text-rose-600">{errors.destination.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="miles" className="block text-sm font-medium text-foreground">
            Miles
          </label>
          <input
            id="miles"
            type="number"
            step="0.1"
            min={0}
            {...register('miles', { valueAsNumber: true })}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
          {errors.miles ? (
            <p className="mt-1 text-xs text-rose-600">{errors.miles.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="commuteDeductionMiles"
            className="block text-sm font-medium text-foreground"
          >
            Commute deduction <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="commuteDeductionMiles"
            type="number"
            step="0.1"
            min={0}
            {...register('commuteDeductionMiles', { setValueAs: optionalNumber })}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
          {errors.commuteDeductionMiles ? (
            <p className="mt-1 text-xs text-rose-600">{errors.commuteDeductionMiles.message}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            The commuting portion of the journey, if any. It is subtracted before the trip is
            priced.
          </p>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
            <input
              type="checkbox"
              {...register('isRoundTrip')}
              disabled={isLocked}
              className="h-4 w-4 rounded border-border"
            />
            Round trip
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="businessPurpose" className="block text-sm font-medium text-foreground">
          Business purpose
        </label>
        <textarea
          id="businessPurpose"
          rows={2}
          {...register('businessPurpose')}
          disabled={isLocked}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
        />
        {errors.businessPurpose ? (
          <p className="mt-1 text-xs text-rose-600">{errors.businessPurpose.message}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Say what the journey was for, specifically enough to stand on its own later. This is the
          field that substantiates the trip if the log is ever examined.
        </p>
      </div>

      {/*
        The affirmation, stated in full rather than abbreviated to a label. A
        recorder who ticks it without knowing what it means produces exactly the
        defective record the field exists to prevent.
      */}
      <div
        className={`rounded-md border px-3 py-3 ${
          affirmed ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-muted'
        }`}
      >
        <label className="flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            {...register('notOrdinaryCommuting')}
            disabled={isLocked}
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>
            <strong>This journey was not ordinary commuting.</strong>
            <span className="mt-1 block text-muted-foreground">
              Travel between home and a regular place of work is commuting, and commuting mileage is
              not reimbursable. Recording it as a business trip would put a cost in the log that
              cannot be defended. The trip cannot be saved without this affirmation.
            </span>
          </span>
        </label>
        {errors.notOrdinaryCommuting ? (
          <p className="mt-2 text-xs text-rose-600">{errors.notOrdinaryCommuting.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="odometerStart" className="block text-sm font-medium text-foreground">
            Odometer start <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="odometerStart"
            type="number"
            step="1"
            min={0}
            {...register('odometerStart', { setValueAs: optionalNumber })}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
          {errors.odometerStart ? (
            <p className="mt-1 text-xs text-rose-600">{errors.odometerStart.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="odometerEnd" className="block text-sm font-medium text-foreground">
            Odometer end <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="odometerEnd"
            type="number"
            step="1"
            min={0}
            {...register('odometerEnd', { setValueAs: optionalNumber })}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
          {errors.odometerEnd ? (
            <p className="mt-1 text-xs text-rose-600">{errors.odometerEnd.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="vehicleDescription" className="block text-sm font-medium text-foreground">
            Vehicle <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="vehicleDescription"
            type="text"
            {...register('vehicleDescription')}
            disabled={isLocked}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-foreground">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          {...register('notes')}
          disabled={isLocked}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLocked}>
          {isSubmitting ? 'Saving…' : trip ? 'Save trip' : 'Record trip'}
        </Button>
      </div>
    </form>
  );
}
