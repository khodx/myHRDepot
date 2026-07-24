import { CalendarRange, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdStatCard } from '@/components/ui/MhdStatCard';
import type { Json } from '@/types/database.types';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateActivities } from '@/appshell/mhdRouteAccess';
import { useMhdCompanies } from '@/features/companies/Hook';
import { mhdActivityBoardFilterSchema, type MhdActivityFormSchemaInput } from '../Schemas';
import {
  useMhdActivities,
  useMhdActivityActions,
  useMhdActivityPeople,
  useMhdActivityTasks,
  useMhdActivityUsers,
} from '../Hook';
import type { MhdActivityBoardFilters, MhdUpdateActivityInput } from '../Types';
import { MhdActivityFilterBar } from './MhdActivityFilterBar';
import { MhdActivityForm } from './MhdActivityForm';
import { MhdActivityList } from './MhdActivityList';

const DEFAULT_FILTERS = mhdActivityBoardFilterSchema.parse({});

function toActivityMutationInput(input: MhdActivityFormSchemaInput): MhdUpdateActivityInput {
  return {
    ...input,
    descriptionRichText: (input.descriptionRichText ?? null) as Json | null,
  };
}

export function MhdActivitiesPage() {
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateActivities(roles);
  const canCrossCompanyFilter = roles.includes('Platform Admin') || roles.includes('HR Partner');
  const [filters, setFilters] = useState<MhdActivityBoardFilters>(DEFAULT_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedCompanyId = canCrossCompanyFilter
    ? filters.companyId !== 'ALL'
      ? filters.companyId
      : (profile?.companyId ?? null)
    : (profile?.companyId ?? null);

  const effectiveFilters = useMemo<MhdActivityBoardFilters>(
    () => ({
      ...filters,
      companyId: canCrossCompanyFilter ? filters.companyId : (profile?.companyId ?? 'ALL'),
    }),
    [canCrossCompanyFilter, filters, profile?.companyId],
  );

  const activitiesQuery = useMhdActivities(effectiveFilters);
  const actions = useMhdActivityActions();
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const peopleQuery = useMhdActivityPeople(selectedCompanyId);
  const usersQuery = useMhdActivityUsers(selectedCompanyId);
  const tasksQuery = useMhdActivityTasks(selectedCompanyId);

  const activities = activitiesQuery.data ?? [];
  const counts = useMemo(() => {
    const rows = activitiesQuery.data ?? [];
    return {
      planned: rows.filter((activity) => activity.status === 'PLANNED').length,
      inProgress: rows.filter((activity) => activity.status === 'IN_PROGRESS').length,
      completed: rows.filter((activity) => activity.status === 'COMPLETED').length,
    };
  }, [activitiesQuery.data]);

  async function handleCreate(input: MhdActivityFormSchemaInput) {
    setActionError(null);
    try {
      await actions.createActivity.mutateAsync(toActivityMutationInput(input));
      setIsCreating(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create activity.');
    }
  }

  const companyOptions = canCrossCompanyFilter
    ? (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.companyName }))
    : [];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Activities"
        description="Interactions around the work: sessions, calls, visits, and events with participants, notes, and outcomes."
        actions={
          canMutate ? (
            <Button onClick={() => setIsCreating((current) => !current)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isCreating ? 'Close Form' : 'New Activity'}
            </Button>
          ) : undefined
        }
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
      {activitiesQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {activitiesQuery.error instanceof Error
            ? activitiesQuery.error.message
            : 'Unable to load activities.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MhdStatCard icon={CalendarRange} label="Planned" value={counts.planned} />
        <MhdStatCard icon={Loader2} label="In Progress" value={counts.inProgress} />
        <MhdStatCard icon={CheckCircle2} label="Completed" value={counts.completed} />
      </div>

      {isCreating && canMutate && selectedCompanyId ? (
        <MhdCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">New Activity</h2>
          <MhdActivityForm
            mode="create"
            companyId={selectedCompanyId}
            currentUserId={profile?.userId ?? ''}
            people={(peopleQuery.data ?? []).map((person) => ({
              id: person.id,
              label: person.displayName,
            }))}
            users={(usersQuery.data ?? []).map((user) => ({
              id: user.id,
              label: user.displayName,
            }))}
            tasks={(tasksQuery.data ?? []).map((task) => ({
              id: task.id,
              label: `${task.referenceId} — ${task.title}`,
            }))}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isSubmitting={actions.createActivity.isPending}
          />
        </MhdCard>
      ) : null}

      <MhdCard>
        <MhdActivityFilterBar
          filters={effectiveFilters}
          onChange={setFilters}
          companies={companyOptions}
          people={(peopleQuery.data ?? []).map((person) => ({
            id: person.id,
            label: person.displayName,
          }))}
          tasks={(tasksQuery.data ?? []).map((task) => ({
            id: task.id,
            label: `${task.referenceId} — ${task.title}`,
          }))}
        />
      </MhdCard>

      <MhdCard className="overflow-hidden p-0">
        {activitiesQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading activities…
          </div>
        ) : (
          <MhdActivityList activities={activities} />
        )}
      </MhdCard>
    </div>
  );
}
