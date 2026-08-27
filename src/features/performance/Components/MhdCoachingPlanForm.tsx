import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdCoachingPlanFormSchema, type MhdCoachingPlanFormSchemaInput } from '../Schemas';
import type { MhdCoachingPlan, MhdPerformanceOption } from '../Types';

interface Props {
  mode: 'create' | 'edit';
  companyId: string;
  initial?: MhdCoachingPlan;
  /** Pre-fills source_review_id when the plan is spawned from a review (create mode). */
  sourceReviewId?: string | null;
  sourceReviewLabel?: string | null;
  /** People directory (coached employee picker). */
  people: MhdPerformanceOption[];
  /** Assignable users (coach picker). */
  coaches: MhdPerformanceOption[];
  onSubmit: (input: MhdCoachingPlanFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function MhdCoachingPlanForm({
  mode,
  companyId,
  initial,
  sourceReviewId,
  sourceReviewLabel,
  people,
  coaches,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCoachingPlanFormSchemaInput>({
    resolver: zodResolver(mhdCoachingPlanFormSchema),
    defaultValues: initial
      ? {
          companyId: initial.companyId,
          personId: initial.personId,
          coachUserId: initial.coachUserId,
          title: initial.title,
          objective: initial.objective ?? undefined,
          startDate: initial.startDate ?? undefined,
          targetDate: initial.targetDate ?? undefined,
          outcomeSummary: initial.outcomeSummary ?? undefined,
          sourceReviewId: initial.sourceReviewId ?? undefined,
        }
      : {
          companyId,
          sourceReviewId: sourceReviewId ?? undefined,
        },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {mode === 'create' && sourceReviewId ? (
        <div className="rounded-md border border-accent/30 bg-accent-tint p-3 text-sm text-accent-hover">
          This plan will be linked to review {sourceReviewLabel ?? sourceReviewId} as its source.
        </div>
      ) : null}

      <MhdFormFieldStack>
        <div>
          <label htmlFor="mhd-coaching-form-person" className="mb-1 block text-sm font-medium">
            Person
          </label>
          <select
            id="mhd-coaching-form-person"
            className="w-full rounded border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"
            disabled={mode === 'edit'}
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
          <label htmlFor="mhd-coaching-form-coach" className="mb-1 block text-sm font-medium">
            Coach
          </label>
          <select
            id="mhd-coaching-form-coach"
            className="w-full rounded border px-3 py-2"
            {...register('coachUserId')}
          >
            <option value="">Select coach…</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.label}
              </option>
            ))}
          </select>
          {errors.coachUserId ? (
            <p className="mt-1 text-xs text-red-600">{errors.coachUserId.message}</p>
          ) : null}
        </div>
      </MhdFormFieldStack>

      <div>
        <label htmlFor="mhd-coaching-form-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="mhd-coaching-form-title"
          className="w-full rounded border px-3 py-2"
          {...register('title')}
        />
        {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="mhd-coaching-form-objective" className="mb-1 block text-sm font-medium">
          Objective
        </label>
        <textarea
          id="mhd-coaching-form-objective"
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="What should this plan achieve?"
          {...register('objective')}
        />
      </div>

      <MhdFormFieldStack>
        <div>
          <label htmlFor="mhd-coaching-form-start" className="mb-1 block text-sm font-medium">
            Start Date
          </label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-coaching-form-start"
                className="w-full"
                value={field.value ?? ''}
                onChange={(nextValue) => field.onChange(nextValue || null)}
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="mhd-coaching-form-target" className="mb-1 block text-sm font-medium">
            Target Date
          </label>
          <Controller
            name="targetDate"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="mhd-coaching-form-target"
                className="w-full"
                value={field.value ?? ''}
                onChange={(nextValue) => field.onChange(nextValue || null)}
              />
            )}
          />
          {errors.targetDate ? (
            <p className="mt-1 text-xs text-red-600">{errors.targetDate.message}</p>
          ) : null}
        </div>
      </MhdFormFieldStack>

      <div>
          <label htmlFor="mhd-coaching-form-outcome" className="mb-1 block text-sm font-medium">
            Outcome Summary
          </label>
          <textarea
            id="mhd-coaching-form-outcome"
            className="w-full rounded border px-3 py-2"
            rows={3}
            placeholder="What was the result of this plan?"
            {...register('outcomeSummary')}
          />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-accent-on disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Coaching Plan' : 'Save Changes'}
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
