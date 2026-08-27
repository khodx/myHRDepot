import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml, mhdPlainTextToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { mhdActivityFormSchema, type MhdActivityFormSchemaInput } from '@/features/activities/Schemas';
import {
  MHD_ACTIVITY_PARTICIPANT_ROLES,
  MHD_ACTIVITY_TYPES,
  type MhdActivity,
  type MhdActivityOption,
  mhdFormatActivityParticipantRole,
  mhdFormatActivityType,
} from '@/features/activities/Types';

type ParticipantKind = 'USER' | 'PERSON';

interface Props {
  mode: 'create' | 'edit';
  companyId: string;
  initial?: MhdActivity;
  currentUserId: string;
  people: MhdActivityOption[];
  users: MhdActivityOption[];
  tasks: MhdActivityOption[];
  onSubmit: (input: MhdActivityFormSchemaInput, checklistTitles: string[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  /** Create mode only: pre-selects "Supports Task" (e.g. opened from a task's
   *  own Activities button), so linking back is automatic rather than manual. */
  defaultParentTaskId?: string;
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
  defaultParentTaskId,
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
          linkLabel: initial.linkLabel ?? undefined,
          linkUrl: initial.linkUrl ?? undefined,
          isConfidential: initial.isConfidential,
          participants: [],
        }
      : {
          companyId,
          activityType: 'MEETING',
          status: 'PLANNED',
          isConfidential: false,
          parentTaskId: defaultParentTaskId,
          participants: [{ userId: currentUserId, role: 'FACILITATOR' }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'participants' });
  const [rowKinds, setRowKinds] = useState<Record<string, ParticipantKind>>({});
  const [checklistTitles, setChecklistTitles] = useState<string[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const participants = useWatch({ control, name: 'participants' });
  const isConfidential = useWatch({ control, name: 'isConfidential' });
  const selectedPersonId = useWatch({ control, name: 'personId' });
  const descriptionPlainText = useWatch({ control, name: 'descriptionPlainText' }) ?? '';
  const descriptionRichText = useWatch({ control, name: 'descriptionRichText' });

  function participantKind(fieldId: string, index: number): ParticipantKind {
    return rowKinds[fieldId] ?? (participants?.[index]?.personId ? 'PERSON' : 'USER');
  }

  function handleKindChange(fieldId: string, index: number, kind: ParticipantKind) {
    setRowKinds((current) => ({ ...current, [fieldId]: kind }));
    setValue(`participants.${index}.userId`, undefined);
    setValue(`participants.${index}.personId`, undefined);
  }

  function handleAddChecklistTitle() {
    const title = newChecklistTitle.trim();
    if (!title) return;
    setChecklistTitles((current) => [...current, title]);
    setNewChecklistTitle('');
  }

  function handleRemoveChecklistTitle(index: number) {
    setChecklistTitles((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((data) => onSubmit(data, checklistTitles))}
    >
      <MhdFormFieldStack>
        <div>
          <label htmlFor="activityType" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="activityType"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register('activityType')}
          >
            {MHD_ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatActivityType(type)}
              </option>
            ))}
          </select>
          {errors.activityType ? (
            <p className="mt-1 text-xs text-red-600">{errors.activityType.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="personId" className="mb-1 block text-sm font-medium">
            Person
          </label>
          <select
            id="personId"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register('personId')}
          >
            <option value="">Company-centered (no person)</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </div>
      </MhdFormFieldStack>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register('title')}
        />
        {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="parentTaskId" className="mb-1 block text-sm font-medium">
          Supports Task
        </label>
        <select
          id="parentTaskId"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...register('parentTaskId')}
        >
          <option value="">Not linked to a task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.label}
            </option>
          ))}
        </select>
      </div>

      <MhdFormFieldStack>
        <div>
          <label htmlFor="scheduledAt" className="mb-1 block text-sm font-medium">
            Scheduled Date &amp; Time
          </label>
          <input
            id="scheduledAt"
            type="datetime-local"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register('scheduledAt')}
          />
        </div>
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Room, phone, or video link…"
            {...register('location')}
          />
        </div>
      </MhdFormFieldStack>

      <MhdFormFieldStack>
        <div>
          <label htmlFor="linkLabel" className="mb-1 block text-sm font-medium">
            Link Title
          </label>
          <input
            id="linkLabel"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="e.g. Job Posting"
            {...register('linkLabel')}
          />
          {errors.linkLabel ? (
            <p className="mt-1 text-xs text-red-600">{errors.linkLabel.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="linkUrl" className="mb-1 block text-sm font-medium">
            Link URL
          </label>
          <input
            id="linkUrl"
            type="url"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="https://example.com"
            {...register('linkUrl')}
          />
          {errors.linkUrl ? (
            <p className="mt-1 text-xs text-red-600">{errors.linkUrl.message}</p>
          ) : null}
        </div>
      </MhdFormFieldStack>

      <div className="rounded-md border border-border p-3">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" {...register('isConfidential')} />
          <span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Confidential
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Visible only to the creator, facilitator participants, Platform Admin, and HR Partner.
            </span>
          </span>
        </label>
        {isConfidential && !selectedPersonId ? (
          <p className="mt-2 text-xs text-amber-700">
            Confidential activities are usually person-centered.
          </p>
        ) : null}
      </div>

      <div>
        <MhdRichTextEditor
          label="Description"
          html={
            descriptionRichText
              ? mhdDocumentToRichHtml(descriptionRichText, descriptionPlainText)
              : mhdPlainTextToRichHtml(descriptionPlainText)
          }
          onChange={(_, plainText, document) => {
            setValue('descriptionPlainText', plainText, { shouldDirty: true });
            setValue('descriptionRichText', document, { shouldDirty: true });
          }}
          placeholder="What is this interaction about?"
        />
      </div>

      {mode === 'create' ? (
        <fieldset className="space-y-2 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium">Participants</legend>

          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No participants added.</p>
          ) : null}

          {fields.map((field, index) => {
            const kind = participantKind(field.id, index);
            return (
              <div key={field.id} className="flex flex-wrap items-center gap-2">
                <select
                  value={kind}
                  onChange={(event) =>
                    handleKindChange(field.id, index, event.target.value as ParticipantKind)
                  }
                  className="rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Participant kind"
                >
                  <option value="USER">Internal user</option>
                  <option value="PERSON">Person</option>
                </select>

                {kind === 'USER' ? (
                  <select
                    className="min-w-48 flex-1 rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Participant user"
                    {...register(`participants.${index}.userId`)}
                  >
                    <option value="">Select user…</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="min-w-48 flex-1 rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Participant person"
                    {...register(`participants.${index}.personId`)}
                  >
                    <option value="">Select person…</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.label}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  className="rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Participant role"
                  {...register(`participants.${index}.role`)}
                >
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
                  className="rounded p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
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
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add participant
          </button>
        </fieldset>
      ) : null}

      {mode === 'create' ? (
        <fieldset className="space-y-2 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium">Checklist</legend>
          <p className="text-xs text-muted-foreground">
            Add starter checklist items now, or skip this and add them later from the activity's detail page.
          </p>

          {checklistTitles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checklist items added.</p>
          ) : (
            <ul className="space-y-1.5">
              {checklistTitles.map((title, index) => (
                <li
                  key={`${index}-${title}`}
                  className="flex items-center justify-between gap-2 rounded border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistTitle(index)}
                    aria-label={`Remove ${title}`}
                    className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <input
              value={newChecklistTitle}
              onChange={(event) => setNewChecklistTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddChecklistTitle();
                }
              }}
              placeholder="Checklist item…"
              className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="button"
              onClick={handleAddChecklistTitle}
              disabled={newChecklistTitle.trim().length === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </fieldset>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Activity' : 'Save Changes'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
