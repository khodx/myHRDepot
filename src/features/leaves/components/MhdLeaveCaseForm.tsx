import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mhdLeaveCaseFormSchema, type MhdLeaveCaseFormValues } from '../Schemas';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  companyId: string;
  people: PersonOption[];
  onSubmit: (values: MhdLeaveCaseFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Opens a leave case for one person.
 *
 * The case captures only WHO, WHY (a free reason category) and WHEN — never the
 * legal bases and never any medical detail. The designation set is chosen
 * afterwards on the case detail page (v1: the administrator's explicit choice),
 * and medical certification lives in its own partitioned table. Keeping this
 * form deliberately thin is what stops medical narrative from landing on the
 * case record.
 */
export function MhdLeaveCaseForm({ companyId, people, onSubmit, onCancel, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdLeaveCaseFormValues>({
    resolver: zodResolver(mhdLeaveCaseFormSchema),
    defaultValues: {
      companyId,
      personId: '',
      reasonCategory: '',
      requestedStart: null,
      requestedEnd: null,
      isIntermittent: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />

      <div>
        <label htmlFor="personId" className="block text-sm font-medium text-neutral-700">
          Employee
        </label>
        <select
          id="personId"
          {...register('personId')}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
        <label htmlFor="reasonCategory" className="block text-sm font-medium text-neutral-700">
          Reason category
        </label>
        <input
          id="reasonCategory"
          type="text"
          {...register('reasonCategory')}
          placeholder="e.g. Serious health condition, Bonding, Caregiver"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {/* A category, not a diagnosis. The specific medical circumstance belongs
            in the partitioned certification store, never on the case. */}
        <p className="mt-1 text-xs text-neutral-500">
          Record a category only. Do not enter diagnosis or medical detail here.
        </p>
        {errors.reasonCategory ? (
          <p className="mt-1 text-xs text-rose-600">{errors.reasonCategory.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="requestedStart" className="block text-sm font-medium text-neutral-700">
            Requested start <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="requestedStart"
            type="date"
            {...register('requestedStart')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="requestedEnd" className="block text-sm font-medium text-neutral-700">
            Requested end <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="requestedEnd"
            type="date"
            {...register('requestedEnd')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.requestedEnd ? (
            <p className="mt-1 text-xs text-rose-600">{errors.requestedEnd.message}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register('isIntermittent')} className="rounded border-neutral-300" />
        Intermittent leave (taken in separate blocks)
      </label>

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
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Opening…' : 'Open case'}
        </button>
      </div>
    </form>
  );
}
