import { CalendarClock, Plus, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdActivities, useMhdActivityActions } from '@/features/activities/Hook';
import type { MhdActivityBoardFilters, MhdActivityStatus } from '@/features/activities/Types';
import type { MhdPerformanceOption } from '../Types';

const STATUS_BADGE_VARIANT: Record<MhdActivityStatus, MhdBadgeVariant> = {
  PLANNED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'error',
};

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
        <MhdFilterSelect
          label="Person"
          id="mhd-one-on-one-person"
          value={personId}
          onChange={(event) => setPersonId(event.target.value)}
        >
          <option value="ALL">All people</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </MhdFilterSelect>

        {canMutate ? (
          <Button onClick={() => setIsCreating((current) => !current)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {isCreating ? 'Close Form' : 'New One-on-One'}
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
      {activitiesQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {activitiesQuery.error instanceof Error
            ? activitiesQuery.error.message
            : 'Unable to load one-on-ones.'}
        </div>
      ) : null}

      {isCreating && canMutate ? (
        <form
          className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm"
          onSubmit={handleQuickCreate}
        >
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
            <p className="text-xs text-amber-700">
              Select a person above — one-on-ones are person-centered.
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={
                actions.createActivity.isPending ||
                newTitle.trim().length === 0 ||
                personId === 'ALL'
              }
            >
              {actions.createActivity.isPending ? 'Creating…' : 'Create One-on-One'}
            </Button>
            <Button variant="secondary" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {activitiesQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading one-on-ones…
        </div>
      ) : activities.length === 0 ? (
        <MhdEmptyState
          icon={Users}
          title="No one-on-ones yet"
          description={`No one-on-ones recorded${personId !== 'ALL' ? ' for this person' : ''} yet.`}
        />
      ) : (
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>One-on-One</MhdTh>
              <MhdTh>Person</MhdTh>
              <MhdTh>Status</MhdTh>
              <MhdTh>Scheduled</MhdTh>
              <MhdTh>Outcome</MhdTh>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <MhdTr key={activity.id} to={`/activities/${activity.id}`}>
                <MhdTd>
                  <Link
                    to={`/activities/${activity.id}`}
                    className="font-medium text-accent hover:text-accent-hover"
                  >
                    {activity.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{activity.referenceId}</div>
                </MhdTd>
                <MhdTd>
                  {activity.personDisplayName ?? <span className="text-muted-foreground">—</span>}
                </MhdTd>
                <MhdTd>
                  <MhdBadge variant={STATUS_BADGE_VARIANT[activity.status]} hideIcon>
                    {activity.status}
                  </MhdBadge>
                </MhdTd>
                <MhdTd>
                  {activity.scheduledAt ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      {new Date(activity.scheduledAt).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unscheduled</span>
                  )}
                </MhdTd>
                <MhdTd className="max-w-64 truncate text-muted-foreground">
                  {activity.outcomeSummary ?? <span className="text-muted-foreground">—</span>}
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      )}
    </div>
  );
}
