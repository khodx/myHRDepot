import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMhdCreateInterview, useMhdInterviewPeople } from '../Hook';
import { mhdInterviewScheduleSchema, type MhdInterviewScheduleFormValues } from '../Schemas';

interface Props {
  companyId: string;
  applicationId: string;
  /**
   * The requisition's guide, if one exists — the interview draws its worksheet from
   * it. Injected by the host (usually the guide id from `MhdInterviewGuideBuilder`).
   */
  guideId?: string | null;
}

/**
 * Schedule an interview — record-only in v1 (no calendar).
 *
 * Names an interviewer (a PERSON, from the company's people), an optional type and
 * date, and ties the interview to the requisition's guide. Creating it notifies the
 * interviewer server-side; they then see only their own worksheet. Admin-only at the
 * RPC — this panel is shown on the recruiter/HM surface.
 */
export function MhdInterviewSchedulePanel({ companyId, applicationId, guideId = null }: Props) {
  const people = useMhdInterviewPeople(companyId);
  const createInterview = useMhdCreateInterview();

  const peopleOptions = useMemo(
    () =>
      (people.data ?? []).map(
        (person: {
          id: string;
          firstName?: string;
          lastName?: string;
          preferredName?: string | null;
        }) => ({
          id: person.id,
          displayName:
            person.preferredName || [person.firstName, person.lastName].filter(Boolean).join(' '),
        }),
      ),
    [people.data],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MhdInterviewScheduleFormValues>({
    resolver: zodResolver(mhdInterviewScheduleSchema),
    defaultValues: {
      applicationId,
      interviewerPersonId: '',
      guideId: guideId ?? '',
      interviewType: '',
      scheduledDate: '',
    },
  });

  async function handleCreate(values: MhdInterviewScheduleFormValues) {
    await createInterview.mutateAsync({
      applicationId: values.applicationId,
      interviewerPersonId: values.interviewerPersonId,
      guideId: values.guideId || guideId || null,
      interviewType: values.interviewType || null,
      scheduledDate: values.scheduledDate || null,
    });
    reset({
      applicationId,
      interviewerPersonId: '',
      guideId: guideId ?? '',
      interviewType: '',
      scheduledDate: '',
    });
  }

  return (
    <MhdCard className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Schedule an interview</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Assigns an interviewer to conduct this interview. They are notified and can then complete
          their scorecard.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
        <input type="hidden" {...register('applicationId')} readOnly />
        <input type="hidden" {...register('guideId')} readOnly />

        <MhdFormFieldStack>
          <div>
            <label
              htmlFor="interviewerPersonId"
              className="block text-sm font-medium text-foreground"
            >
              Interviewer
            </label>
            <select
              id="interviewerPersonId"
              {...register('interviewerPersonId')}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">Choose a person…</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
            {errors.interviewerPersonId ? (
              <p className="mt-1 text-xs text-rose-600">{errors.interviewerPersonId.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="interviewType" className="block text-sm font-medium text-foreground">
              Type <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="interviewType"
              type="text"
              {...register('interviewType')}
              placeholder="e.g. Phone screen, Panel"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-foreground">
              Date <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Controller
              name="scheduledDate"
              control={control}
              render={({ field }) => (
                <MhdDateField
                  id="scheduledDate"
                  className="mt-1 w-full"
                  value={field.value ?? ''}
                  onChange={(nextValue) => field.onChange(nextValue)}
                />
              )}
            />
          </div>
        </MhdFormFieldStack>

        <div className="flex justify-end">
          <Button type="submit" disabled={createInterview.isPending}>
            {createInterview.isPending ? 'Scheduling…' : 'Schedule interview'}
          </Button>
        </div>
        {createInterview.isError ? (
          <p className="text-xs text-rose-600">
            {createInterview.error instanceof Error
              ? createInterview.error.message
              : 'Unable to schedule the interview.'}
          </p>
        ) : null}
      </form>
    </MhdCard>
  );
}
