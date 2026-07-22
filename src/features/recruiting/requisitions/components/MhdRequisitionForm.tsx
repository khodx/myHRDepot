import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mhdRequisitionFormSchema, type MhdRequisitionFormValues } from '../Schemas';

interface PersonOption {
  id: string;
  displayName: string;
}

interface JobOption {
  id: string;
  title: string;
}

interface Props {
  companyId: string;
  /**
   * People eligible to be the hiring manager (a `person`). Naming one grants that
   * person read access to their own requisition even without a full admin role.
   */
  hiringManagers: PersonOption[];
  /**
   * Jobs (from Job Descriptions `0033`) this opening can point at. Optional — a
   * req may be drafted before a JD exists — but package 2's interview questions
   * need it set. Passed in by the host route; this form does not fetch Jobs.
   */
  jobs?: JobOption[];
  onSubmit: (values: MhdRequisitionFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Create a requisition — an opening for a job.
 *
 * Only the title is required; a req can be drafted before the JD, hiring manager,
 * or location are known and filled in later. It is born in DRAFT; opening it is a
 * separate transition on the detail page (which also runs any approval gate).
 * `requiresApproval` is the optional gate, off by default.
 */
export function MhdRequisitionForm({
  companyId,
  hiringManagers,
  jobs,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdRequisitionFormValues>({
    resolver: zodResolver(mhdRequisitionFormSchema),
    defaultValues: {
      companyId,
      title: '',
      jobId: '',
      hiringManagerPersonId: '',
      department: '',
      location: '',
      employmentType: '',
      headcount: 1,
      requiresApproval: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          placeholder="e.g. Senior Payroll Specialist"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.title ? (
          <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="jobId" className="block text-sm font-medium text-neutral-700">
            Job <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <select
            id="jobId"
            {...register('jobId')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">No job selected</option>
            {(jobs ?? []).map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Links the JD and its competencies; needed for package-2 interview questions.
          </p>
        </div>

        <div>
          <label
            htmlFor="hiringManagerPersonId"
            className="block text-sm font-medium text-neutral-700"
          >
            Hiring manager <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <select
            id="hiringManagerPersonId"
            {...register('hiringManagerPersonId')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">No hiring manager</option>
            {hiringManagers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Grants that person read access to their own requisition.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-neutral-700">
            Department <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="department"
            type="text"
            {...register('department')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-neutral-700">
            Location <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="location"
            type="text"
            {...register('location')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="employmentType"
            className="block text-sm font-medium text-neutral-700"
          >
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
          <label htmlFor="headcount" className="block text-sm font-medium text-neutral-700">
            Headcount
          </label>
          <input
            id="headcount"
            type="number"
            min={1}
            step={1}
            {...register('headcount')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.headcount ? (
            <p className="mt-1 text-xs text-rose-600">{errors.headcount.message}</p>
          ) : null}
        </div>

        <div className="flex items-start gap-2 pt-6">
          <input
            id="requiresApproval"
            type="checkbox"
            {...register('requiresApproval')}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
          />
          <label htmlFor="requiresApproval" className="text-sm text-neutral-700">
            Requires approval
            <span className="block text-xs font-normal text-neutral-500">
              When set, opening the requisition runs an approval before it can accept applicants.
            </span>
          </label>
        </div>
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
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create requisition'}
        </button>
      </div>
    </form>
  );
}
