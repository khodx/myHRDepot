import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { mhdOccurrenceFormSchema, type MhdOccurrenceFormValues } from '../Schemas';
import {
  MHD_ATTENDANCE_CLASSIFICATIONS,
  MHD_OCCURRENCE_TYPES,
  MHD_PROTECTED_LEAVE_CATEGORIES,
  mhdClassificationCanAccrue,
  mhdFormatClassification,
  mhdFormatOccurrenceType,
  mhdFormatProtectedLeaveCategory,
  mhdProjectedPoints,
  type MhdAttendancePolicy,
} from '../Types';

interface PersonOption {
  id: string;
  displayName: string;
}

interface Props {
  companyId: string;
  people: PersonOption[];
  /** The company's open policy version; null when none is configured yet. */
  policy: MhdAttendancePolicy | null;
  /** Pre-selects the person and date when recording against a specific shift. */
  presetPersonId?: string | null;
  presetDate?: string | null;
  presetShiftId?: string | null;
  onSubmit: (values: MhdOccurrenceFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Records one deviation from the schedule.
 *
 * The form's job beyond data entry is to make the points consequence visible
 * BEFORE saving. A recorder who does not realise that marking an absence
 * protected removes its points, or that leaving it unexcused adds them, is the
 * person most likely to produce an inconsistent record — so the projection is
 * shown as a first-class field rather than discovered afterwards.
 *
 * The database is the authority throughout (CHECK on the classification/
 * category pairing, trigger on the ledger). Nothing here gates anything; it
 * explains.
 */
export function MhdOccurrenceForm({
  companyId,
  people,
  policy,
  presetPersonId,
  presetDate,
  presetShiftId,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<MhdOccurrenceFormValues>({
    resolver: zodResolver(mhdOccurrenceFormSchema),
    defaultValues: {
      personId: presetPersonId ?? '',
      occurrenceDate: presetDate ?? new Date().toISOString().slice(0, 10),
      occurrenceType: 'ABSENCE',
      classification: 'UNEXCUSED',
      protectedLeaveCategory: null,
      scheduledShiftId: presetShiftId ?? null,
    },
  });

  const classification = useWatch({ control, name: 'classification' });
  const occurrenceType = useWatch({ control, name: 'occurrenceType' });

  const isProtected = classification === 'PROTECTED';
  const accrues = mhdClassificationCanAccrue(classification, policy);
  const projected = mhdProjectedPoints(occurrenceType, classification, policy);

  // The category and the classification are paired by a database CHECK in both
  // directions. Clearing it when the classification moves off PROTECTED keeps
  // the payload legal without the user having to notice.
  useEffect(() => {
    if (!isProtected) {
      setValue('protectedLeaveCategory', null, { shouldValidate: true });
    }
  }, [isProtected, setValue]);

  const showsMinutes =
    occurrenceType === 'TARDY' ||
    occurrenceType === 'EARLY_DEPARTURE' ||
    occurrenceType === 'PARTIAL_ABSENCE';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} readOnly />

      <div>
        <label htmlFor="personId" className="block text-sm font-medium text-neutral-700">
          Employee
        </label>
        <select
          id="personId"
          {...register('personId')}
          disabled={Boolean(presetPersonId)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="occurrenceDate" className="block text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="occurrenceDate"
            type="date"
            {...register('occurrenceDate')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.occurrenceDate ? (
            <p className="mt-1 text-xs text-rose-600">{errors.occurrenceDate.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="occurrenceType" className="block text-sm font-medium text-neutral-700">
            What happened
          </label>
          <select
            id="occurrenceType"
            {...register('occurrenceType')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {MHD_OCCURRENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatOccurrenceType(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showsMinutes ? (
        <div>
          <label htmlFor="minutesVariance" className="block text-sm font-medium text-neutral-700">
            Minutes
          </label>
          <input
            id="minutesVariance"
            type="number"
            min={0}
            {...register('minutesVariance', { valueAsNumber: true })}
            className="mt-1 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.minutesVariance ? (
            <p className="mt-1 text-xs text-rose-600">{errors.minutesVariance.message}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="classification" className="block text-sm font-medium text-neutral-700">
          Classification
        </label>
        <select
          id="classification"
          {...register('classification')}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {MHD_ATTENDANCE_CLASSIFICATIONS.map((value) => (
            <option key={value} value={value}>
              {mhdFormatClassification(value)}
            </option>
          ))}
        </select>
      </div>

      {isProtected ? (
        <div>
          <label
            htmlFor="protectedLeaveCategory"
            className="block text-sm font-medium text-neutral-700"
          >
            Protected leave category
          </label>
          <select
            id="protectedLeaveCategory"
            {...register('protectedLeaveCategory')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Select a category…</option>
            {MHD_PROTECTED_LEAVE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {mhdFormatProtectedLeaveCategory(category)}
              </option>
            ))}
          </select>
          {errors.protectedLeaveCategory ? (
            <p className="mt-1 text-xs text-rose-600">{errors.protectedLeaveCategory.message}</p>
          ) : null}
        </div>
      ) : null}

      {/*
        The points consequence, stated plainly. Protected leave gets its own
        wording rather than a bare "0 points" so the recorder understands this
        is a rule and not a configuration they might change.
      */}
      <div
        className={`rounded-md border px-3 py-2 text-sm ${
          isProtected
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : accrues
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-neutral-200 bg-neutral-50 text-neutral-700'
        }`}
      >
        {isProtected ? (
          <>
            <strong>No points.</strong> Protected leave can never accrue attendance points, under
            any policy setting.
          </>
        ) : !policy ? (
          <>
            <strong>No points.</strong> No attendance policy is configured yet, so nothing will
            accrue.
          </>
        ) : accrues ? (
          <>
            <strong>
              {projected} point{projected === 1 ? '' : 's'}
            </strong>{' '}
            will be assessed under the current policy.
          </>
        ) : (
          <>
            <strong>No points.</strong> The current policy does not assess points for{' '}
            {mhdFormatClassification(classification).toLowerCase()} absences.
          </>
        )}
      </div>

      <div>
        <label htmlFor="reasonNote" className="block text-sm font-medium text-neutral-700">
          Note <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="reasonNote"
          rows={3}
          {...register('reasonNote')}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {/*
          Deliberate guidance, not decoration. Medical detail and safe-time
          narrative do not belong in a field the whole privileged role set can
          read; the category column already carries what the record needs.
        */}
        <p className="mt-1 text-xs text-neutral-500">
          Keep this factual. Do not record medical details or the circumstances behind a protected
          absence.
        </p>
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
          {isSubmitting ? 'Recording…' : 'Record occurrence'}
        </button>
      </div>
    </form>
  );
}
