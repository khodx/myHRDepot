import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';
import { useMhdFeedbackSettings, useMhdUpsertFeedbackSettings } from '../Hook-v2';
import { MHD_FEEDBACK_THRESHOLD_FLOOR } from '../Types-v2';
import { mhdFeedbackSettingsSchema, type MhdFeedbackSettingsFormValues } from '../Schemas-v2';

interface Props {
  companyId: string;
}

/**
 * The company's anonymity dial for 360 feedback, and the only one there is.
 *
 * This is a config screen: it sets the rules under which anonymous aggregates are
 * released. It never touches an individual peer or upward response — there is no
 * such read anywhere in v2, by design.
 *
 * The release threshold has a HARD FLOOR of 3, matching the database CHECK
 * `performance_feedback_threshold_floor`. It is not a suggestion: an aggregate
 * built from one or two responses can be traced straight back to the individuals
 * by anyone who knows who was invited, and the invitation list is administratively
 * visible. The UI refuses to offer a lower value for the same reason the database
 * refuses to store one.
 */
export function MhdFeedbackSettingsForm({ companyId }: Props) {
  const settingsQuery = useMhdFeedbackSettings(companyId);
  const upsertSettings = useMhdUpsertFeedbackSettings(companyId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MhdFeedbackSettingsFormValues>({
    resolver: zodResolver(mhdFeedbackSettingsSchema),
    defaultValues: {
      companyId,
      minResponsesForRelease: MHD_FEEDBACK_THRESHOLD_FLOOR,
      releaseVerbatimComments: true,
    },
  });

  // The settings load asynchronously; seed the form once they arrive. Values from
  // the hook are already normalised — do not re-parse them.
  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        companyId,
        minResponsesForRelease: settingsQuery.data.minResponsesForRelease,
        releaseVerbatimComments: settingsQuery.data.releaseVerbatimComments,
      });
    }
  }, [settingsQuery.data, companyId, reset]);

  const onSubmit = handleSubmit((values) => {
    upsertSettings.mutate({
      minResponsesForRelease: values.minResponsesForRelease,
      releaseVerbatimComments: values.releaseVerbatimComments,
    });
  });

  if (settingsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading feedback settings…</p>;
  }
  if (settingsQuery.isError) {
    return <p className="text-sm text-rose-600">Feedback settings could not be loaded.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <h2 className="text-base font-semibold text-foreground">360 feedback settings</h2>

      <div>
        <label
          htmlFor="minResponsesForRelease"
          className="block text-sm font-medium text-foreground"
        >
          Release threshold
        </label>
        <input
          id="minResponsesForRelease"
          type="number"
          min={MHD_FEEDBACK_THRESHOLD_FLOOR}
          step={1}
          {...register('minResponsesForRelease', { valueAsNumber: true })}
          className="mt-1 w-32 rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.minResponsesForRelease ? (
          <p className="mt-1 text-xs text-rose-600">{errors.minResponsesForRelease.message}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Anonymous peer and upward feedback is shown only once at least this many people have
          answered. <strong>Three is a hard minimum, not a suggestion</strong> — over one or two
          responses an aggregate can be traced back to the individuals by anyone who knows who was
          invited, so it cannot be set lower. Raise it for greater protection; upward feedback,
          where a direct report rates the manager who decides their pay, is the case it exists for.
        </p>
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-0.5" {...register('releaseVerbatimComments')} />
          <span>
            Release verbatim comments alongside the aggregate ratings.
            <span className="mt-1 block text-xs text-muted-foreground">
              Comments are released under the same threshold as the ratings — turning this off
              withholds them entirely, but it can never release them earlier. Free text identifies
              its author more readily than a number, not less.
            </span>
          </span>
        </label>
      </div>

      {upsertSettings.isError ? (
        <p className="text-xs text-rose-600">The settings could not be saved.</p>
      ) : null}
      {upsertSettings.isSuccess ? (
        <p className="text-xs text-emerald-700">Settings saved.</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={upsertSettings.isPending}
          className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
        >
          {upsertSettings.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
