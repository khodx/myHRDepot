import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { mhdActivityFormSchema, type MhdActivityFormSchemaInput } from '../Schemas';
import {
  MHD_ACTIVITY_PARTICIPANT_ROLES,
  MHD_ACTIVITY_TYPES,
  type MhdActivity,
  type MhdActivityOption,
  mhdFormatActivityParticipantRole,
  mhdFormatActivityType,
} from '../Types';

type ParticipantKind = 'USER' | 'PERSON';

interface Props {
  mode: 'create' | 'edit';
  companyId: string;
  initial?: MhdActivity;
  currentUserId: string;
  people: MhdActivityOption[];
  users: MhdActivityOption[];
  tasks: MhdActivityOption[];
  onSubmit: (input: MhdActivityFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MhdActivityForm({
  mode,
  companyId,
  initial,
  currentUserId,
  people,
  users,
  tasks,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MhdActivityFormSchemaInput>({
    resolver: zodResolver(mhdActivityFormSchema),
    defaultValues: initial
      ? {
          companyId: initial.companyId,
          activityType: initial.activityType,
          title: initial.title,
          personId: initial.personId ?? undefined,
          parentTaskId: initial.parentTaskId ?? undefined,
          descriptionPlainText: initial.descriptionPlainText ?? undefined,
          descriptionRichText: initial.descriptionRichText ?? undefined,
          status: initial.status,
          scheduledAt: toDateTimeLocalValue(initial.scheduledAt) || undefined,
          occurredAt: toDateTimeLocalValue(initial.occurredAt) || undefined,
          durationMinutes: initial.durationMinutes ?? undefined,
          location: initial.location ?? undefined,
          outcomeSummary: initial.outcomeSummary ?? undefined,
          followUpTaskId: initial.followUpTaskId ?? undefined,
          isConfidential: initial.isConfidential,
          participants: [],
        }
      : {
          companyId,
          activityType: 'MEETING',
          status: 'PLANNED',
          isConfidential: false,
          participants: [{ userId: currentUserId, role: 'FACILITATOR' }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'participants' });
  const [rowKinds, setRowKinds] = useState<Record<string, ParticipantKind>>({});
  const participants = useWatch({ control, name: 'participants' });
  const isConfidential = useWatch({ control, name: 'isConfidential' });
  const selectedPersonId = useWatch({ control, name: 'personId' });

  function participantKind(fieldId: string, index: number): ParticipantKind {
    return rowKinds[fieldId] ?? (participants?.[index]?.personId ? 'PERSON' : 'USER');
  }

  function handleKindChange(fieldId: string, index: number, kind: ParticipantKind) {
    setRowKinds((current) => ({ ...current, [fieldId]: kind }));
    setValue(`participants.${index}.userId`, undefined);
    setValue(`participants.${index}.personId`, undefined);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select className="w-full rounded border px-3 py-2" {...register('activityType')}>
            {MHD_ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatActivityType(type)}
              </option>
            ))}
          </select>
          {errors.activityType ? <p className="mt-1 text-xs text-red-600">{errors.activityType.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Person</label>
          <select className="w-full rounded border px-3 py-2" {...register('personId')}>
            <option value="">Company-centered (no person)</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input className="w-full rounded border px-3 py-2" {...register('title')} />
        {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Supports Task</label>
        <select className="w-full rounded border px-3 py-2" {...register('parentTaskId')}>
          <option value="">Not linked to a task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Scheduled Date &amp; Time</label>
          <input type="datetime-local" className="w-full rounded border px-3 py-2" {...register('scheduledAt')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input className="w-full rounded border px-3 py-2" placeholder="Room, phone, or video link…" {...register('location')} />
        </div>
      </div>

      <div className="rounded border p-3">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" {...register('isConfidential')} />
          <span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Confidential
            </span>
            <span className="mt-0.5 block text-xs text-neutral-500">
              Visible only to the creator, facilitator participants, Platform Admin, and HR Partner.
            </span>
          </span>
        </label>
        {isConfidential && !selectedPersonId ? (
          <p className="mt-2 text-xs text-amber-700">Confidential activities are usually person-centered.</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded border px-3 py-2"
          rows={4}
          placeholder="What is this interaction about?"
          {...register('descriptionPlainText')}
        />
      </div>

      {mode === 'create' ? (
        <fieldset className="space-y-2 rounded border p-3">
          <legend className="px-1 text-sm font-medium">Participants</legend>

          {fields.length === 0 ? <p className="text-sm text-neutral-400">No participants added.</p> : null}

          {fields.map((field, index) => {
            const kind = participantKind(field.id, index);
            return (
              <div key={field.id} className="flex flex-wrap items-center gap-2">
                <select
                  value={kind}
                  onChange={(event) => handleKindChange(field.id, index, event.target.value as ParticipantKind)}
                  className="rounded border px-2 py-2 text-sm"
                  aria-label="Participant kind"
                >
                  <option value="USER">Internal user</option>
                  <option value="PERSON">Person</option>
                </select>

                {kind === 'USER' ? (
                  <select className="min-w-48 flex-1 rounded border px-2 py-2 text-sm" aria-label="Participant user" {...register(`participants.${index}.userId`)}>
                    <option value="">Select user…</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select className="min-w-48 flex-1 rounded border px-2 py-2 text-sm" aria-label="Participant person" {...register(`participants.${index}.personId`)}>
                    <option value="">Select person…</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.label}
                      </option>
                    ))}
                  </select>
                )}

                <select className="rounded border px-2 py-2 text-sm" aria-label="Participant role" {...register(`participants.${index}.role`)}>
                  {MHD_ACTIVITY_PARTICIPANT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {mhdFormatActivityParticipantRole(role)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove participant row"
                  className="rounded p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {errors.participants ? (
            <p className="text-xs text-red-600">
              {typeof errors.participants.message === 'string'
                ? errors.participants.message
                : 'Each participant needs exactly one subject and a role.'}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => append({ role: 'PARTICIPANT' })}
            className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add participant
          </button>
        </fieldset>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Activity' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
