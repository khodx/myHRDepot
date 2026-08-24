import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { mhdCaseFormSchema, type MhdCaseFormSchemaInput } from '../Schemas';
import {
  MHD_SEPARATION_TYPES,
  type MhdOffboardingCase,
  type MhdOffboardingOption,
  mhdFormatSeparationType,
} from '../Types';

interface Props {
  mode: 'create' | 'edit';
  companyId: string;
  initial?: MhdOffboardingCase;
  /** People directory (separation subjects). */
  people: MhdOffboardingOption[];
  onSubmit: (input: MhdCaseFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Create/edit the separation facts. The person is fixed at creation (the case IS
 * that person's separation record); mhd_update_offboarding_case accepts the
 * remaining facts plus the rehire tri-state, and refuses terminal states — the
 * detail page only offers editing on ACTIVE cases, but the server is the gate.
 */
export function MhdOffboardingCaseForm({
  mode,
  companyId,
  initial,
  people,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const personLocked = mode === 'edit';

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCaseFormSchemaInput>({
    resolver: zodResolver(mhdCaseFormSchema),
    defaultValues: initial
      ? {
          companyId: initial.companyId,
          personId: initial.personId,
          separationType: initial.separationType,
          separationDate: initial.separationDate,
          lastWorkingDay: initial.lastWorkingDay ?? undefined,
          reasonSummary: initial.reasonSummary ?? undefined,
          eligibleForRehire:
            initial.eligibleForRehire === null ? '' : initial.eligibleForRehire ? 'YES' : 'NO',
        }
      : {
          companyId,
          separationType: 'RESIGNATION',
          eligibleForRehire: '',
        },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="mhd-offboarding-form-person" className="mb-1 block text-sm font-medium">
            Person
          </label>
          <select
            id="mhd-offboarding-form-person"
            className="w-full rounded border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
            disabled={personLocked}
            {...register('personId')}
          >
            <option value="">Select person…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          {errors.personId ? (
            <p className="mt-1 text-xs text-red-600">{errors.personId.message}</p>
          ) : null}
          {personLocked ? (
            <p className="mt-1 text-xs text-muted-foreground">
              The person is set at creation and cannot be changed.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              One active case per person — creating a case initiates the separation process and
              seeds the exit checklist.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="mhd-offboarding-form-type" className="mb-1 block text-sm font-medium">
            Separation Type
          </label>
          <select
            id="mhd-offboarding-form-type"
            className="w-full rounded border px-3 py-2"
            {...register('separationType')}
          >
            {MHD_SEPARATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatSeparationType(type)}
              </option>
            ))}
          </select>
          {errors.separationType ? (
            <p className="mt-1 text-xs text-red-600">{errors.separationType.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="mhd-offboarding-form-separation-date"
            className="mb-1 block text-sm font-medium"
          >
            Separation Date
          </label>
          <Controller
            name="separationDate"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-offboarding-form-separation-date"
                className="w-full"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">Notice / decision date.</p>
          {errors.separationDate ? (
            <p className="mt-1 text-xs text-red-600">{errors.separationDate.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="mhd-offboarding-form-last-working-day"
            className="mb-1 block text-sm font-medium"
          >
            Last Working Day
          </label>
          <Controller
            name="lastWorkingDay"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-offboarding-form-last-working-day"
                className="w-full"
                value={field.value ?? ''}
                onChange={(nextValue) => field.onChange(nextValue || null)}
              />
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Optional; on or after the separation date.
          </p>
          {errors.lastWorkingDay ? (
            <p className="mt-1 text-xs text-red-600">{errors.lastWorkingDay.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mhd-offboarding-form-rehire" className="mb-1 block text-sm font-medium">
            Eligible for Rehire
          </label>
          <select
            id="mhd-offboarding-form-rehire"
            className="w-full rounded border px-3 py-2"
            {...register('eligibleForRehire')}
          >
            <option value="">Undetermined</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
          {errors.eligibleForRehire ? (
            <p className="mt-1 text-xs text-red-600">{errors.eligibleForRehire.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="mhd-offboarding-form-reason" className="mb-1 block text-sm font-medium">
          Reason Summary
        </label>
        <textarea
          id="mhd-offboarding-form-reason"
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="Sensitive narrative — visible only to privileged roles and the initiator."
          {...register('reasonSummary')}
        />
        {errors.reasonSummary ? (
          <p className="mt-1 text-xs text-red-600">{errors.reasonSummary.message}</p>
        ) : null}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Open Offboarding Case' : 'Save Changes'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
