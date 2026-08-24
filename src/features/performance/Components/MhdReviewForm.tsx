import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { mhdReviewFormSchema, type MhdReviewFormSchemaInput } from '../Schemas';
import {
  MHD_REVIEW_TYPES,
  type MhdPerformanceOption,
  type MhdPerformanceReview,
  mhdFormatReviewType,
} from '../Types';
import { MhdRatingStars } from './MhdRatingStars';
import { MhdDateField } from '@/components/ui/MhdDateField';

interface Props {
  mode: 'create' | 'edit';
  companyId: string;
  initial?: MhdPerformanceReview;
  /** People directory (review subjects). */
  people: MhdPerformanceOption[];
  /** Assignable users (reviewer picker). */
  reviewers: MhdPerformanceOption[];
  /** ONE_ON_ONE / MEETING activities eligible as the linked review meeting. */
  meetingActivities: MhdPerformanceOption[];
  onSubmit: (input: MhdReviewFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function MhdReviewForm({
  mode,
  companyId,
  initial,
  people,
  reviewers,
  meetingActivities,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  // Setup fields (subject, reviewer, type, period, due date) are create-time only:
  // mhd_update_performance_review accepts content fields, rating, and the meeting link.
  const setupLocked = mode === 'edit';
  // Content is immutable from PENDING_SIGNATURE onward; the detail page only offers
  // editing in DRAFT/IN_REVIEW, but guard here as well.
  const contentLocked =
    initial != null && initial.status !== 'DRAFT' && initial.status !== 'IN_REVIEW';

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MhdReviewFormSchemaInput>({
    resolver: zodResolver(mhdReviewFormSchema),
    defaultValues: initial
      ? {
          companyId: initial.companyId,
          personId: initial.personId,
          reviewerUserId: initial.reviewerUserId,
          reviewType: initial.reviewType,
          reviewPeriodStart: initial.reviewPeriodStart,
          reviewPeriodEnd: initial.reviewPeriodEnd,
          dueDate: initial.dueDate ?? undefined,
          reviewActivityId: initial.reviewActivityId ?? undefined,
          overallRating: initial.overallRating ?? undefined,
          strengthsSummary: initial.strengthsSummary ?? undefined,
          improvementSummary: initial.improvementSummary ?? undefined,
          goalsSummary: initial.goalsSummary ?? undefined,
          reviewerComments: initial.reviewerComments ?? undefined,
          employeeComments: initial.employeeComments ?? undefined,
        }
      : {
          companyId,
          reviewType: 'INTRODUCTORY',
        },
  });

  const overallRating = useWatch({ control, name: 'overallRating' });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="mhd-review-form-person" className="mb-1 block text-sm font-medium">
            Subject
          </label>
          <select
            id="mhd-review-form-person"
            className="w-full rounded border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
            disabled={setupLocked}
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
        </div>

        <div>
          <label htmlFor="mhd-review-form-reviewer" className="mb-1 block text-sm font-medium">
            Reviewer
          </label>
          <select
            id="mhd-review-form-reviewer"
            className="w-full rounded border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
            disabled={setupLocked}
            {...register('reviewerUserId')}
          >
            <option value="">Select reviewer…</option>
            {reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>
                {reviewer.label}
              </option>
            ))}
          </select>
          {errors.reviewerUserId ? (
            <p className="mt-1 text-xs text-red-600">{errors.reviewerUserId.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="mhd-review-form-type" className="mb-1 block text-sm font-medium">
            Review Type
          </label>
          <select
            id="mhd-review-form-type"
            className="w-full rounded border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
            disabled={setupLocked}
            {...register('reviewType')}
          >
            {MHD_REVIEW_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatReviewType(type)}
              </option>
            ))}
          </select>
          {errors.reviewType ? (
            <p className="mt-1 text-xs text-red-600">{errors.reviewType.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mhd-review-form-period-start" className="mb-1 block text-sm font-medium">
            Period Start
          </label>
          <Controller
            name="reviewPeriodStart"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-review-form-period-start"
                className="w-full"
                disabled={setupLocked}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          {errors.reviewPeriodStart ? (
            <p className="mt-1 text-xs text-red-600">{errors.reviewPeriodStart.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mhd-review-form-period-end" className="mb-1 block text-sm font-medium">
            Period End
          </label>
          <Controller
            name="reviewPeriodEnd"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-review-form-period-end"
                className="w-full"
                disabled={setupLocked}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          {errors.reviewPeriodEnd ? (
            <p className="mt-1 text-xs text-red-600">{errors.reviewPeriodEnd.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mhd-review-form-due-date" className="mb-1 block text-sm font-medium">
            Due Date
          </label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-review-form-due-date"
                className="w-full"
                disabled={setupLocked}
                value={field.value ?? ''}
                onChange={(nextValue) => field.onChange(nextValue || null)}
              />
            )}
          />
        </div>
      </div>

      {setupLocked ? (
        <p className="text-xs text-muted-foreground">
          Subject, reviewer, type, period, and due date are set at creation and cannot be changed
          here.
        </p>
      ) : null}

      <div>
        <label htmlFor="mhd-review-form-activity" className="mb-1 block text-sm font-medium">
          Review Meeting (Activity)
        </label>
        <select
          id="mhd-review-form-activity"
          className="w-full rounded border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
          disabled={contentLocked}
          {...register('reviewActivityId')}
        >
          <option value="">Not linked to a meeting</option>
          {meetingActivities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-4 rounded border p-4" disabled={contentLocked}>
        <legend className="px-1 text-sm font-medium">
          {contentLocked ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Review Content (locked)
            </span>
          ) : (
            'Review Content'
          )}
        </legend>

        <MhdRatingStars
          variant="input"
          idPrefix="mhd-review-form-rating"
          legend="Overall Rating (1–5)"
          value={overallRating ?? null}
          onChange={(value) =>
            setValue('overallRating', value, { shouldDirty: true, shouldValidate: true })
          }
          disabled={contentLocked}
        />
        {errors.overallRating ? (
          <p className="text-xs text-red-600">{errors.overallRating.message}</p>
        ) : null}

        <div>
          <label htmlFor="mhd-review-form-strengths" className="mb-1 block text-sm font-medium">
            Strengths
          </label>
          <textarea
            id="mhd-review-form-strengths"
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder="What is this person doing well?"
            {...register('strengthsSummary')}
          />
        </div>

        <div>
          <label htmlFor="mhd-review-form-improvements" className="mb-1 block text-sm font-medium">
            Areas for Improvement
          </label>
          <textarea
            id="mhd-review-form-improvements"
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder="Where should this person grow?"
            {...register('improvementSummary')}
          />
        </div>

        <div>
          <label htmlFor="mhd-review-form-goals" className="mb-1 block text-sm font-medium">
            Goals
          </label>
          <textarea
            id="mhd-review-form-goals"
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder="Goals for the next period…"
            {...register('goalsSummary')}
          />
        </div>

        <div>
          <label
            htmlFor="mhd-review-form-reviewer-comments"
            className="mb-1 block text-sm font-medium"
          >
            Reviewer Comments
          </label>
          <textarea
            id="mhd-review-form-reviewer-comments"
            className="w-full rounded border px-3 py-2"
            rows={3}
            {...register('reviewerComments')}
          />
        </div>

        <div>
          <label
            htmlFor="mhd-review-form-employee-comments"
            className="mb-1 block text-sm font-medium"
          >
            Employee Comments
          </label>
          <textarea
            id="mhd-review-form-employee-comments"
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder="Captured at or after the review meeting…"
            {...register('employeeComments')}
          />
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-accent-on disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Review' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
