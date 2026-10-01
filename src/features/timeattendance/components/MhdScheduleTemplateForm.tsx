import { useState } from 'react';
import { useForm, useWatch, type FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MHD_FIELD_INPUT_CLASS } from '@/components/ui/MhdFieldLabel';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { mhdScheduleTemplateFormSchema, type MhdScheduleTemplateFormValues } from '../Schemas';
import type { MhdScheduleTemplateDetail } from '../Types';

/** Sunday-first, matching `day_of_week` (0 = Sunday) in the database. */
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

type FormInput = z.input<typeof mhdScheduleTemplateFormSchema>;

interface Props {
  companyId: string;
  /** Present when viewing or editing; absent when creating. */
  template?: MhdScheduleTemplateDetail | null;
  /** View mode renders the same layout with every control disabled. */
  readOnly?: boolean;
  /** Edit mode exposes the active toggle; a new pattern is always created active. */
  showActiveToggle?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (values: MhdScheduleTemplateFormValues, isActive: boolean) => Promise<void> | void;
  onCancel?: () => void;
}

/** `time` columns come back as HH:MM:SS; the time input and the schema want HH:MM. */
function trimTime(value: string | null | undefined): string | null {
  return value ? value.slice(0, 5) : null;
}

function defaultDays(template: MhdScheduleTemplateDetail | null | undefined): FormInput['days'] {
  return DAY_NAMES.map((_, dayOfWeek) => {
    const existing = template?.days.find((day) => day.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isWorkingDay: existing?.isWorkingDay ?? false,
      startTime: trimTime(existing?.startTime),
      endTime: trimTime(existing?.endTime),
      unpaidBreakMinutes: existing?.unpaidBreakMinutes ?? 0,
    };
  });
}

/**
 * Weekly work pattern editor, shared by the New, View and Edit pages so the three
 * cannot drift. A pattern is seven day rows; the times-match-flag rule is a database
 * CHECK, mirrored in the schema so a bad row reads as a field message rather than a
 * failed save. Editing a pattern never rewrites history - assignments already made
 * keep resolving against the version of the pattern they were generated from.
 */
export function MhdScheduleTemplateForm({
  companyId,
  template,
  readOnly = false,
  showActiveToggle = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormInput>({
    defaultValues: {
      companyId,
      templateName: template?.templateName ?? '',
      description: template?.description ?? '',
      days: defaultDays(template),
    },
  });

  /**
   * Validates with the schema directly and maps each issue onto its field. The schema is
   * the single source of truth either way; doing it here (rather than through a form
   * resolver) keeps the field messages working irrespective of which resolver/zod
   * pairing the app is on.
   */
  function validateAndSubmit(raw: FormInput) {
    clearErrors();
    const parsed = mhdScheduleTemplateFormSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.') as FieldPath<FormInput>;
        setError(path, { type: 'validate', message: issue.message });
      }
      return;
    }
    return onSubmit?.(parsed.data, isActive);
  }

  const days = useWatch({ control, name: 'days' });
  const [isActive, setIsActive] = useState(template?.isActive ?? true);

  const weeklyHours = (days ?? []).reduce((total, day) => {
    if (!day?.isWorkingDay || !day.startTime || !day.endTime) return total;
    const [startHour = 0, startMinute = 0] = day.startTime.split(':').map(Number);
    const [endHour = 0, endMinute = 0] = day.endTime.split(':').map(Number);
    const minutes =
      endHour * 60 + endMinute - (startHour * 60 + startMinute) - (day.unpaidBreakMinutes ?? 0);
    return total + Math.max(minutes, 0) / 60;
  }, 0);

  function toggleWorking(index: number, working: boolean) {
    setValue(`days.${index}.isWorkingDay`, working);
    if (!working) {
      // A non-working day must not carry times (database CHECK).
      setValue(`days.${index}.startTime`, null);
      setValue(`days.${index}.endTime`, null);
      setValue(`days.${index}.unpaidBreakMinutes`, 0);
    }
  }

  return (
    <form onSubmit={handleSubmit(validateAndSubmit)} className="space-y-6">
      <MhdCard className="space-y-4">
        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-foreground">
            Pattern name
          </label>
          <input
            id="templateName"
            type="text"
            disabled={readOnly}
            {...register('templateName')}
            className={MHD_FIELD_INPUT_CLASS}
          />
          {errors.templateName ? (
            <p className="mt-1 text-xs text-rose-600">{errors.templateName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={2}
            disabled={readOnly}
            {...register('description')}
            className={MHD_FIELD_INPUT_CLASS}
          />
        </div>

        {showActiveToggle ? (
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              disabled={readOnly}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active (inactive patterns cannot receive new assignments)
          </label>
        ) : null}
      </MhdCard>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Weekly pattern</h2>
          <p className="text-sm text-muted-foreground">
            {weeklyHours.toFixed(1)} paid hours per week
          </p>
        </div>

        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Day</MhdTh>
                <MhdTh>Working</MhdTh>
                <MhdTh>Start</MhdTh>
                <MhdTh>End</MhdTh>
                <MhdTh>Unpaid break (min)</MhdTh>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((name, index) => {
                const working = Boolean(days?.[index]?.isWorkingDay);
                const dayErrors = errors.days?.[index];
                return (
                  <MhdTr key={name}>
                    <MhdTd className="whitespace-nowrap font-medium">{name}</MhdTd>
                    <MhdTd>
                      <input
                        type="checkbox"
                        aria-label={`${name} is a working day`}
                        checked={working}
                        disabled={readOnly}
                        onChange={(event) => toggleWorking(index, event.target.checked)}
                      />
                    </MhdTd>
                    <MhdTd>
                      <input
                        type="time"
                        aria-label={`${name} start time`}
                        disabled={readOnly || !working}
                        {...register(`days.${index}.startTime`, {
                          setValueAs: (value: string) => (value ? value : null),
                        })}
                        className="rounded-md border border-border bg-card px-2 py-1 text-sm disabled:bg-muted"
                      />
                      {dayErrors?.startTime ? (
                        <p className="mt-1 text-xs text-rose-600">{dayErrors.startTime.message}</p>
                      ) : null}
                    </MhdTd>
                    <MhdTd>
                      <input
                        type="time"
                        aria-label={`${name} end time`}
                        disabled={readOnly || !working}
                        {...register(`days.${index}.endTime`, {
                          setValueAs: (value: string) => (value ? value : null),
                        })}
                        className="rounded-md border border-border bg-card px-2 py-1 text-sm disabled:bg-muted"
                      />
                      {dayErrors?.endTime ? (
                        <p className="mt-1 text-xs text-rose-600">{dayErrors.endTime.message}</p>
                      ) : null}
                    </MhdTd>
                    <MhdTd>
                      <input
                        type="number"
                        min={0}
                        max={480}
                        aria-label={`${name} unpaid break minutes`}
                        disabled={readOnly || !working}
                        {...register(`days.${index}.unpaidBreakMinutes`, {
                          setValueAs: (value: string | number) =>
                            value === '' || value == null ? 0 : Number(value),
                        })}
                        className="w-20 rounded-md border border-border bg-card px-2 py-1 text-sm disabled:bg-muted"
                      />
                    </MhdTd>
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
        </MhdCard>

        {errors.days?.message || errors.days?.root?.message ? (
          <p className="text-xs text-rose-600">
            {errors.days?.message ?? errors.days?.root?.message}
          </p>
        ) : null}
      </section>

      {readOnly ? null : (
        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : template ? 'Save Pattern' : 'Create Pattern'}
          </Button>
        </div>
      )}
    </form>
  );
}
