import { CalendarClock, Plus, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMhdActivities, useMhdActivityActions } from '@/features/activities/Hook';
import type { MhdActivityBoardFilters } from '@/features/activities/Types';
import type { MhdPerformanceOption } from '../Types';

interface Props {
  companyId: string;
  currentUserId: string;
  canMutate: boolean;
  /** People directory options for the person scope selector. */
  people: MhdPerformanceOption[];
}

/**
 * Person-scoped surface over ONE_ON_ONE Activities, consumed entirely through the
 * Activities Hook contract (business rule 8: one-on-ones own no schema).
 */
export function MhdOneOnOneTab({ companyId, currentUserId, canMutate, people }: Props) {
  const [personId, setPersonId] = useState<string>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const filters = useMemo<MhdActivityBoardFilters>(
    () => ({
      companyId,
      personId,
      taskId: 'ALL',
      activityType: 'ONE_ON_ONE',
      status: 'ALL',
      searchTerm: '',
      from: '',
      to: '',
    }),
    [companyId, personId],
  );

  const activitiesQuery = useMhdActivities(filters);
  const actions = useMhdActivityActions();
  const activities = activitiesQuery.data ?? [];

  async function handleQuickCreate(event: FormEvent) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title || personId === 'ALL') return;
    setActionError(null);
    try {
      await actions.createActivity.mutateAsync({
        companyId,
        activityType: 'ONE_ON_ONE',
        title,
        personId,
        status: 'PLANNED',
        scheduledAt: newScheduledAt || null,
        participants: [{ userId: currentUserId, role: 'FACILITATOR' }],
      });
      setNewTitle('');
      setNewScheduledAt('');
      setIsCreating(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create one-on-one.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="mhd-one-on-one-person" className="mb-1 block text-xs font-medium text-neutral-500">
            Person
          </label>
          <select
            id="mhd-one-on-one-person"
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="ALL">All people</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </div>

        {canMutate ? (
          <button
            type="button"
            onClick={() => setIsCreating((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Close Form' : 'New One-on-One'}
          </button>
        ) : null}
      </div>

      {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}
      {activitiesQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {activitiesQuery.error instanceof Error ? activitiesQuery.error.message : 'Unable to load one-on-ones.'}
        </div>
      ) : null}

      {isCreating && canMutate ? (
        <form className="space-y-3 rounded-lg border border-slate-200 bg-card p-4 shadow-sm" onSubmit={handleQuickCreate}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="mhd-one-on-one-title" className="mb-1 block text-sm font-medium">
                Title
              </label>
              <input
                id="mhd-one-on-one-title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="One-on-one topic…"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="mhd-one-on-one-scheduled" className="mb-1 block text-sm font-medium">
                Scheduled Date &amp; Time
              </label>
              <input
                id="mhd-one-on-one-scheduled"
                type="datetime-local"
                value={newScheduledAt}
                onChange={(event) => setNewScheduledAt(event.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>
          {personId === 'ALL' ? (
            <p className="text-xs text-amber-700">Select a person above — one-on-ones are person-centered.</p>
          ) : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={actions.createActivity.isPending || newTitle.trim().length === 0 || personId === 'ALL'}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {actions.createActivity.isPending ? 'Creating…' : 'Create One-on-One'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {activitiesQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading one-on-ones…</div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
          <Users className="mb-2 h-8 w-8" />
          <p className="text-sm">No one-on-ones recorded{personId !== 'ALL' ? ' for this person' : ''} yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="py-2 pr-4">One-on-One</th>
                <th className="py-2 pr-4">Person</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Scheduled</th>
                <th className="py-2 pr-4">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b last:border-0 hover:bg-neutral-50">
                  <td className="py-2 pr-4">
                    <Link to={`/activities/${activity.id}`} className="font-medium hover:underline">
                      {activity.title}
                    </Link>
                    <div className="text-xs text-neutral-400">{activity.referenceId}</div>
                  </td>
                  <td className="py-2 pr-4">{activity.personDisplayName ?? <span className="text-neutral-400">—</span>}</td>
                  <td className="py-2 pr-4">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{activity.status}</span>
                  </td>
                  <td className="py-2 pr-4">
                    {activity.scheduledAt ? (
                      <span className="inline-flex items-center gap-1 text-neutral-600">
                        <CalendarClock className="h-4 w-4 text-neutral-400" />
                        {new Date(activity.scheduledAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-neutral-400">Unscheduled</span>
                    )}
                  </td>
                  <td className="max-w-64 truncate py-2 pr-4 text-neutral-600">
                    {activity.outcomeSummary ?? <span className="text-neutral-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
