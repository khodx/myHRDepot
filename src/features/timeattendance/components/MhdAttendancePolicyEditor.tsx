import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { mhdAttendancePolicySchema, type MhdAttendancePolicyFormValues } from '../Schemas';
import {
  MHD_ATTENDANCE_ACTION_LEVELS,
  MHD_OCCURRENCE_TYPES,
  mhdFormatActionLevel,
  mhdFormatOccurrenceType,
  type MhdAttendancePolicy,
} from '../Types';
import { mhdToIsoDateString } from '@/utils/mhdDateFormat';

interface Props {
  companyId: string;
  /** The open version, or null when configuring for the first time. */
  current: MhdAttendancePolicy | null;
  onSubmit: (values: MhdAttendancePolicyFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  /** True when the employee-facing read-only rendering is wanted. */
  readOnly?: boolean;
}

/**
 * Point values, roll-off window and the escalation ladder.
 *
 * Saving does not edit the current policy — it closes that version and opens a
 * new one. Historical ledger entries keep pointing at the version that produced
 * them, so an assessment made two years ago stays explicable under the rule
 * that governed it. The copy says so, because an administrator who believes
 * they are editing history will write a different policy than one who knows
 * they are not.
 *
 * There is no "protected leave accrues" control, permanently. The column does
 * not exist in the database; offering the switch would invite an unlawful
 * configuration.
 */
export function MhdAttendancePolicyEditor({
  companyId,
  current,
  onSubmit,
  onCancel,
  isSubmitting,
  readOnly = false,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdAttendancePolicyFormValues>({
    resolver: zodResolver(mhdAttendancePolicySchema),
    defaultValues: {
      companyId,
      policyName: current?.policyName ?? 'Attendance policy',
      effectiveFrom: mhdToIsoDateString(),
      rollOffMonths: current?.rollOffMonths ?? 12,
      excusedUnpaidAccrues: current?.excusedUnpaidAccrues ?? false,
      excusedPaidAccrues: current?.excusedPaidAccrues ?? false,
      pointRules:
        current?.pointRules ??
        MHD_OCCURRENCE_TYPES.map((occurrenceType) => ({ occurrenceType, points: 0 })),
      thresholds:
        current?.thresholds.map((threshold) => ({
          pointsAt: threshold.pointsAt,
          actionLevel: threshold.actionLevel,
        })) ?? [],
    },
  });

  const { fields: ruleFields } = useFieldArray({ control, name: 'pointRules' });
  const {
    fields: thresholdFields,
    append: appendThreshold,
    remove: removeThreshold,
  } = useFieldArray({ control, name: 'thresholds' });

  if (readOnly) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Attendance policy</h2>
        {!current ? (
          <p className="text-sm text-muted-foreground">No policy has been published yet.</p>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-medium text-foreground">What each occurrence costs</h3>
              <ul className="mt-1 space-y-0.5 text-sm text-foreground">
                {current.pointRules.map((rule) => (
                  <li key={rule.occurrenceType}>
                    {mhdFormatOccurrenceType(rule.occurrenceType)} — {rule.points}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Escalation</h3>
              <ul className="mt-1 space-y-0.5 text-sm text-foreground">
                {current.thresholds.map((threshold) => (
                  <li key={threshold.id}>
                    {threshold.pointsAt} points — {mhdFormatActionLevel(threshold.actionLevel)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Points roll off {current.rollOffMonths} months after the absence. Protected leave
              never accrues points.
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
        Saving publishes a <strong>new version</strong>. Existing point assessments keep the rules
        they were made under — this never rewrites past decisions.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="policyName" className="block text-sm font-medium text-foreground">
            Policy name
          </label>
          <input
            id="policyName"
            {...register('policyName')}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          {errors.policyName ? (
            <p className="mt-1 text-xs text-rose-600">{errors.policyName.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="effectiveFrom" className="block text-sm font-medium text-foreground">
            Effective from
          </label>
          <Controller
            name="effectiveFrom"
            control={control}
            render={({ field }) => (
              <MhdDateField
                id="effectiveFrom"
                className="mt-1 w-full"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div>
        <label htmlFor="rollOffMonths" className="block text-sm font-medium text-foreground">
          Points roll off after (months)
        </label>
        <input
          id="rollOffMonths"
          type="number"
          min={1}
          {...register('rollOffMonths', { valueAsNumber: true })}
          className="mt-1 w-32 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {errors.rollOffMonths ? (
          <p className="mt-1 text-xs text-rose-600">{errors.rollOffMonths.message}</p>
        ) : null}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Points per occurrence</legend>
        <div className="mt-2 space-y-2">
          {ruleFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3">
              <span className="w-48 text-sm text-foreground">
                {mhdFormatOccurrenceType(field.occurrenceType)}
              </span>
              <input
                type="number"
                step="0.25"
                min={0}
                {...register(`pointRules.${index}.points` as const, { valueAsNumber: true })}
                className="w-24 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <input type="hidden" {...register(`pointRules.${index}.occurrenceType` as const)} />
            </div>
          ))}
        </div>
        {errors.pointRules ? (
          <p className="mt-1 text-xs text-rose-600">{errors.pointRules.message as string}</p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Which absences count</legend>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('excusedUnpaidAccrues')} />
            Excused unpaid absences accrue points
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('excusedPaidAccrues')} />
            Excused paid absences accrue points
          </label>
          {/*
            Not a toggle. Stated as a fact so nobody goes looking for the
            control, and so the reason is on screen where the policy is written.
          */}
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-900">
            Protected leave never accrues points. This is not configurable — counting protected
            absences against an employee is unlawful.
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Escalation ladder</legend>
        <div className="mt-2 space-y-2">
          {thresholdFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3">
              <input
                type="number"
                step="0.25"
                min={0}
                placeholder="Points"
                {...register(`thresholds.${index}.pointsAt` as const, { valueAsNumber: true })}
                className="w-24 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <select
                {...register(`thresholds.${index}.actionLevel` as const)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {MHD_ATTENDANCE_ACTION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {mhdFormatActionLevel(level)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeThreshold(index)}
                className="text-sm font-medium text-accent hover:text-accent-hover"
              >
                Remove
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            onClick={() => appendThreshold({ pointsAt: 0, actionLevel: 'VERBAL_WARNING' })}
          >
            Add threshold
          </Button>
        </div>
        {errors.thresholds ? (
          <p className="mt-1 text-xs text-rose-600">{errors.thresholds.message as string}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Reaching a threshold raises a review for a person to act on. Nothing is issued
          automatically.
        </p>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing…' : 'Publish new version'}
        </Button>
      </div>
    </form>
  );
}
