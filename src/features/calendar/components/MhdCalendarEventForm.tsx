import { useState } from 'react';
import { format } from 'date-fns';
import { MhdModal } from '@/components/ui/MhdModal';
import {
  useMhdCalendarEvent,
  useMhdCreateCalendarEvent,
  useMhdDeleteCalendarEvent,
  useMhdUpdateCalendarEvent,
} from '../Hook';
import type { MhdCalendarEventInput } from '../Types';

interface PersonOption {
  id: string;
  label: string;
}

interface Props {
  onClose: () => void;
  /** Create mode: the day clicked (or "New Event" default). */
  initialDate?: Date;
  /** Edit mode: the existing event's id. */
  eventId?: string;
  ownPersonId: string | null;
  /** Company-wide people list, shown only when non-empty (privileged roles). */
  peopleOptions: PersonOption[];
}

export function MhdCalendarEventForm({ onClose, initialDate, eventId, ownPersonId, peopleOptions }: Props) {
  const isEditMode = Boolean(eventId);
  const existing = useMhdCalendarEvent(eventId ?? null);
  const createEvent = useMhdCreateCalendarEvent();
  const updateEvent = useMhdUpdateCalendarEvent();
  const deleteEvent = useMhdDeleteCalendarEvent();

  const [personId, setPersonId] = useState(ownPersonId ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(format(initialDate ?? new Date(), 'yyyy-MM-dd'));
  const [eventEndDate, setEventEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Adjusting state during render (React's documented alternative to an
  // Effect for "reset local state when fetched data arrives") rather than
  // an Effect body, which would commit the empty initial render first and
  // then a second cascading render once the query resolves.
  const [appliedEventId, setAppliedEventId] = useState<string | undefined>(undefined);
  if (existing.data && appliedEventId !== eventId) {
    setAppliedEventId(eventId);
    setPersonId(existing.data.personId);
    setTitle(existing.data.title);
    setDescription(existing.data.description ?? '');
    setEventDate(existing.data.eventDate);
    setEventEndDate(existing.data.eventEndDate ?? '');
  }

  const isSaving = createEvent.isPending || updateEvent.isPending;
  const canChoosePerson = peopleOptions.length > 0;

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!personId) {
      setError('Select who this event is for.');
      return;
    }
    if (eventEndDate && eventEndDate < eventDate) {
      setError('End date cannot be before the start date.');
      return;
    }

    const input: MhdCalendarEventInput = {
      personId,
      title: title.trim(),
      eventDate,
      description: description.trim() || null,
      eventEndDate: eventEndDate || null,
    };

    try {
      if (isEditMode && eventId) {
        await updateEvent.mutateAsync({ id: eventId, input });
      } else {
        await createEvent.mutateAsync(input);
      }
      onClose();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to save this event.');
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await deleteEvent.mutateAsync(eventId);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this event.');
    }
  }

  return (
    <MhdModal onClose={onClose} title={isEditMode ? 'Edit Event' : 'New Event'} className="w-full max-w-lg rounded-lg border border-border bg-background shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{isEditMode ? 'Edit Event' : 'New Event'}</h2>

        {isEditMode && existing.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading event...</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-foreground">
              Title
              <input
                type="text"
                value={title}
                onChange={(inputEvent) => setTitle(inputEvent.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                required
              />
            </label>

            {canChoosePerson ? (
              <label className="block text-sm font-medium text-foreground">
                For
                <select
                  value={personId}
                  onChange={(selectEvent) => setPersonId(selectEvent.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                >
                  {ownPersonId ? <option value={ownPersonId}>Me</option> : null}
                  {peopleOptions
                    .filter((person) => person.id !== ownPersonId)
                    .map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.label}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-foreground">
                Start date
                <input
                  type="date"
                  value={eventDate}
                  onChange={(inputEvent) => setEventDate(inputEvent.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                End date (optional)
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(inputEvent) => setEventEndDate(inputEvent.target.value)}
                  min={eventDate}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-foreground">
              Description (optional)
              <textarea
                value={description}
                onChange={(inputEvent) => setDescription(inputEvent.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
              />
            </label>

            {error ? (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              {isEditMode ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteEvent.isPending}
                  className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isEditMode ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </MhdModal>
  );
}
