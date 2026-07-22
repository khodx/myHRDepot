import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  mhdTrainingCourseFormSchema,
  type MhdTrainingCourseFormValues,
} from '../Schemas';
import {
  MHD_TRAINING_CATEGORIES,
  MHD_TRAINING_DELIVERY_MODES,
  mhdFormatTrainingCategory,
  mhdFormatTrainingDeliveryMode,
  type MhdTrainingCourse,
} from '../Types';

interface Props {
  companyId: string;
  /** When present, the form edits this course; otherwise it creates a new one. */
  course?: MhdTrainingCourse | null;
  onSubmit: (values: MhdTrainingCourseFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Create or edit a COMPANY course.
 *
 * A global course is never edited here — the catalog hides the edit affordance
 * for `isGlobal` rows and the RPC refuses it — so this form only ever handles a
 * company course. On edit, `courseKey` is the stable per-scope identifier and is
 * shown read-only; changing it would be a different course.
 *
 * `recurrenceMonths` is the load-bearing optional: left blank it means a ONE-TIME
 * course with no expiry; given a value it becomes the interval that a completion
 * freezes onto itself. The hint says so out loud.
 */
export function MhdTrainingCourseForm({
  companyId,
  course,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const isEdit = Boolean(course);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdTrainingCourseFormValues>({
    resolver: zodResolver(mhdTrainingCourseFormSchema),
    defaultValues: {
      companyId,
      courseKey: course?.courseKey ?? '',
      title: course?.title ?? '',
      description: course?.description ?? '',
      category: course?.category ?? 'OTHER',
      deliveryMode: course?.deliveryMode ?? 'DOCUMENT',
      durationMinutes: course?.durationMinutes ?? null,
      recurrenceMonths: course?.recurrenceMonths ?? null,
      requiresEvidence: course?.requiresEvidence ?? false,
      externalUrl: course?.externalUrl ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="courseKey" className="block text-sm font-medium text-neutral-700">
            Course key
          </label>
          <input
            id="courseKey"
            type="text"
            {...register('courseKey')}
            readOnly={isEdit}
            placeholder="e.g. ca-harassment-supervisor"
            className={`mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm ${
              isEdit ? 'bg-neutral-100 text-neutral-500' : ''
            }`}
          />
          {isEdit ? (
            <p className="mt-1 text-xs text-neutral-500">
              The key is the course’s stable identity and cannot be changed.
            </p>
          ) : null}
          {errors.courseKey ? (
            <p className="mt-1 text-xs text-rose-600">{errors.courseKey.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {MHD_TRAINING_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {mhdFormatTrainingCategory(category)}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className="mt-1 text-xs text-rose-600">{errors.category.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          placeholder="e.g. Sexual harassment prevention (supervisors)"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.title ? (
          <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.description ? (
          <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="deliveryMode" className="block text-sm font-medium text-neutral-700">
            Delivery mode
          </label>
          <select
            id="deliveryMode"
            {...register('deliveryMode')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {MHD_TRAINING_DELIVERY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mhdFormatTrainingDeliveryMode(mode)}
              </option>
            ))}
          </select>
          {errors.deliveryMode ? (
            <p className="mt-1 text-xs text-rose-600">{errors.deliveryMode.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-neutral-700">
            Duration (minutes) <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="durationMinutes"
            type="number"
            min={1}
            step={1}
            {...register('durationMinutes')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.durationMinutes ? (
            <p className="mt-1 text-xs text-rose-600">{errors.durationMinutes.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="recurrenceMonths" className="block text-sm font-medium text-neutral-700">
            Recurrence (months) <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="recurrenceMonths"
            type="number"
            min={1}
            step={1}
            {...register('recurrenceMonths')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {/* The one-time-vs-recurring hint. Blank is not "unknown" — it is a
              deliberate one-time course with no expiry. A value becomes the
              interval a completion freezes onto itself. */}
          <p className="mt-1 text-xs text-neutral-500">
            Leave blank for a one-time course (no expiry). A value (e.g. 24 for CA harassment) sets
            how often it must be redone.
          </p>
          {errors.recurrenceMonths ? (
            <p className="mt-1 text-xs text-rose-600">{errors.recurrenceMonths.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="externalUrl" className="block text-sm font-medium text-neutral-700">
            External URL <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="externalUrl"
            type="url"
            {...register('externalUrl')}
            placeholder="https://…"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.externalUrl ? (
            <p className="mt-1 text-xs text-rose-600">{errors.externalUrl.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="requiresEvidence"
          type="checkbox"
          {...register('requiresEvidence')}
          className="mt-1 h-4 w-4 rounded border-neutral-300"
        />
        <label htmlFor="requiresEvidence" className="text-sm text-neutral-700">
          Requires evidence
          <span className="block text-xs font-normal text-neutral-500">
            When set, an employee cannot self-attest — a certificate must be attached (or an admin
            records the completion).
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
          {isSubmitting ? 'Saving…' : isEdit ? 'Save course' : 'Create course'}
        </button>
      </div>
    </form>
  );
}
