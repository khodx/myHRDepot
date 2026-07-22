import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mhdOfferFormSchema, type MhdOfferFormValues } from '../Schemas';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  applicationId: string;
  /**
   * People eligible to be the new hire's reporting manager (a `person`). Passed in
   * by the host route; this form does not fetch People. The chosen person flows
   * into `job_assignment.manager` at the handoff.
   */
  reportingManagers: PersonOption[];
  /** Optional default job title — the host may seed it from the requisition/application. */
  defaultJobTitle?: string;
  onSubmit: (values: MhdOfferFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Create an offer against an application — the terms of the prospective hire.
 *
 * Only the job title is required; salary, dates, pay frequency, employment type
 * and the reporting manager may be settled before the offer is extended. It is
 * born in DRAFT; extending it to the candidate (and the app-layer document +
 * signature ceremony) is a separate action on the offer detail. `requiresApproval`
 * is the optional gate, off by default. `baseSalary` is left blank (unset) rather
 * than zero when there is no salary yet.
 */
export function MhdOfferForm({
  applicationId,
  reportingManagers,
  defaultJobTitle,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdOfferFormValues>({
    resolver: zodResolver(mhdOfferFormSchema),
    defaultValues: {
      applicationId,
      jobTitle: defaultJobTitle ?? '',
      startDate: '',
      baseSalary: null,
      payFrequency: '',
      employmentType: '',
      reportingManagerPersonId: '',
      offerExpirationDate: '',
      requiresApproval: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('applicationId')} readOnly />

      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700">
          Job title
        </label>
        <input
          id="jobTitle"
          type="text"
          {...register('jobTitle')}
          placeholder="e.g. Senior Payroll Specialist"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.jobTitle ? (
          <p className="mt-1 text-xs text-rose-600">{errors.jobTitle.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700">
            Start date <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="startDate"
            type="date"
            {...register('startDate')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">
            The employment start — becomes the job assignment's effective date at hire.
          </p>
        </div>

        <div>
          <label htmlFor="baseSalary" className="block text-sm font-medium text-neutral-700">
            Base salary <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="baseSalary"
            type="number"
            min={0}
            step="0.01"
            {...register('baseSalary')}
            placeholder="e.g. 72000"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.baseSalary ? (
            <p className="mt-1 text-xs text-rose-600">{errors.baseSalary.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="payFrequency" className="block text-sm font-medium text-neutral-700">
            Pay frequency <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="payFrequency"
            type="text"
            {...register('payFrequency')}
            placeholder="e.g. Annual, Bi-weekly"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="employmentType" className="block text-sm font-medium text-neutral-700">
            Employment type <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="employmentType"
            type="text"
            {...register('employmentType')}
            placeholder="e.g. Full-time"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="reportingManagerPersonId"
            className="block text-sm font-medium text-neutral-700"
          >
            Reporting manager <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <select
            id="reportingManagerPersonId"
            {...register('reportingManagerPersonId')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">No reporting manager</option>
            {reportingManagers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Flows into the new hire's job assignment at acceptance.
          </p>
        </div>

        <div>
          <label
            htmlFor="offerExpirationDate"
            className="block text-sm font-medium text-neutral-700"
          >
            Expiration date <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="offerExpirationDate"
            type="date"
            {...register('offerExpirationDate')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="requiresApproval"
          type="checkbox"
          {...register('requiresApproval')}
          className="mt-1 h-4 w-4 rounded border-neutral-300"
        />
        <label htmlFor="requiresApproval" className="text-sm text-neutral-700">
          Requires approval
          <span className="block text-xs font-normal text-neutral-500">
            When set, the offer carries an approval gate before it is extended (orchestrated
            app-layer).
          </span>
        </label>
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
          {isSubmitting ? 'Creating…' : 'Create offer'}
        </button>
      </div>
    </form>
  );
}
