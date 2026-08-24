import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { mhdLeaveCaseSelfFormSchema, type MhdLeaveCaseSelfFormValues } from '../Schemas';

interface Props {
  onSubmit: (values: MhdLeaveCaseSelfFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Requests leave for yourself — calls mhd_leave_case_create_self, which
 * derives the caller's own person/company server-side, so this form has no
 * employee picker or hidden company field (unlike the admin MhdLeaveCaseForm
 * it otherwise mirrors). Same "category, not a diagnosis" discipline on the
 * reason field for the same reason: medical detail belongs in the
 * partitioned certification store, never on the case.
 */
export function MhdLeaveCaseSelfForm({ onSubmit, onCancel, isSubmitting }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdLeaveCaseSelfFormValues>({
    resolver: zodResolver(mhdLeaveCaseSelfFormSchema),
    defaultValues: {
      reasonCategory: '',
      requestedStart: null,
      requestedEnd: null,
      isIntermittent: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="reasonCategory" className="block text-sm font-medium text-foreground">
          Reason category
        </label>
        <input
          id="reasonCategory"
          type="text"
          {...register('reasonCategory')}
          placeholder="e.g. Serious health condition, Bonding, Caregiver"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Record a category only. Do not enter diagnosis or medical detail here.
        </p>
        {errors.reasonCategory ? (
          <p className="mt-1 text-xs text-rose-600">{errors.reasonCategory.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="requestedStart" className="block text-sm font-medium text-foreground">
            Requested start <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Controller
            name="requestedStart"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="requestedStart"
                className="mt-1 w-full"
                value={field.value ?? ''}
                onChange={(nextValue) => field.onChange(nextValue || null)}
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="requestedEnd" className="block text-sm font-medium text-foreground">
            Requested end <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Controller
            name="requestedEnd"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="requestedEnd"
                className="mt-1 w-full"
                value={field.value ?? ''}
                onChange={(nextValue) => field.onChange(nextValue || null)}
              />
            )}
          />
          {errors.requestedEnd ? (
            <p className="mt-1 text-xs text-rose-600">{errors.requestedEnd.message}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" {...register('isIntermittent')} className="rounded border-border" />
        Intermittent leave (taken in separate blocks)
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Request leave'}
        </Button>
      </div>
    </form>
  );
}
