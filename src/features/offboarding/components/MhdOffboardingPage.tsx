import { AlarmClock, DoorOpen, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { mhdCanMutateOffboarding } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { type MhdCaseFormSchemaInput } from '../Schemas';
import {
  useMhdOffboardingCaseActions,
  useMhdOffboardingCases,
  useMhdOffboardingPeople,
} from '../Hook';
import {
  MHD_CASE_STATUSES,
  MHD_SEPARATION_TYPES,
  type MhdOffboardingCaseBoardFilters,
  mhdFormatCaseStatus,
  mhdFormatSeparationType,
  mhdIsOffboardingCaseOverdue,
} from '../Types';
import { MhdCaseStatusBadge } from './MhdCaseStatusBadge';
import { MhdOffboardingCaseForm } from './MhdOffboardingCaseForm';
import { MhdSeparationTypeBadge } from './MhdSeparationTypeBadge';

const DEFAULT_FILTERS: MhdOffboardingCaseBoardFilters = {
  companyId: '',
  personId: 'ALL',
  separationType: 'ALL',
  status: 'ALL',
  searchTerm: '',
  from: '',
  to: '',
};

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

/**
 * /offboarding — the route admits Platform Admin, HR Partner, and Client Admin
 * only (strictest module: no Client User, no Viewer), so no read-only fallback
 * rendering is needed here; mhdCanMutateOffboarding gates mutations.
 */
export function MhdOffboardingPage() {
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateOffboarding(roles);
  const canCrossCompanyFilter = roles.includes('Platform Admin') || roles.includes('HR Partner');

  const [filters, setFilters] = useState<MhdOffboardingCaseBoardFilters>(DEFAULT_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedCompanyId = canCrossCompanyFilter
    ? filters.companyId !== 'ALL'
      ? filters.companyId
      : (profile?.companyId ?? null)
    : (profile?.companyId ?? null);

  const effectiveFilters = useMemo<MhdOffboardingCaseBoardFilters>(
    () => ({
      ...filters,
      companyId: canCrossCompanyFilter ? filters.companyId : (profile?.companyId ?? 'ALL'),
    }),
    [canCrossCompanyFilter, filters, profile?.companyId],
  );

  const casesQuery = useMhdOffboardingCases(effectiveFilters);
  const actions = useMhdOffboardingCaseActions();
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const peopleQuery = useMhdOffboardingPeople(selectedCompanyId);

  const cases = useMemo(() => casesQuery.data ?? [], [casesQuery.data]);

  const counts = useMemo(() => {
    const active = cases.filter((offboardingCase) => offboardingCase.status === 'ACTIVE');
    return {
      active: active.length,
      itemsOutstanding: active.reduce(
        (total, offboardingCase) =>
          total +
          Math.max(offboardingCase.requiredTotalCount - offboardingCase.requiredDoneCount, 0),
        0,
      ),
      completed: cases.filter((offboardingCase) => offboardingCase.status === 'COMPLETED').length,
    };
  }, [cases]);

  const companyOptions = canCrossCompanyFilter
    ? (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.companyName }))
    : [];
  const peopleOptions = (peopleQuery.data ?? []).map((person) => ({
    id: person.id,
    label: person.displayName,
  }));

  function update(patch: Partial<MhdOffboardingCaseBoardFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function handleCreateCase(input: MhdCaseFormSchemaInput) {
    setActionError(null);
    try {
      await actions.createCase.mutateAsync(input);
      setIsCreating(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to open the offboarding case.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Offboarding"
        description="Separation cases with an evidence-backed exit checklist: property, exit acknowledgment, access, final pay."
        actions={
          canMutate ? (
            <Button
              type="button"
              onClick={() => setIsCreating((current) => !current)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Close Form' : 'New Case'}
            </Button>
          ) : undefined
        }
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
      {casesQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {casesQuery.error instanceof Error
            ? casesQuery.error.message
            : 'Unable to load offboarding cases.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MhdCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{counts.active}</p>
        </MhdCard>
        <MhdCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Items Outstanding
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
            {counts.itemsOutstanding}
          </p>
        </MhdCard>
        <MhdCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Completed
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
            {counts.completed}
          </p>
        </MhdCard>
      </div>

      {isCreating && canMutate && selectedCompanyId ? (
        <MhdCard>
          <MhdCardHeader title="New Offboarding Case" />
          <MhdOffboardingCaseForm
            mode="create"
            companyId={selectedCompanyId}
            people={peopleOptions}
            onSubmit={handleCreateCase}
            onCancel={() => setIsCreating(false)}
            isSubmitting={actions.createCase.isPending}
          />
        </MhdCard>
      ) : null}

      <MhdCard className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label
            htmlFor="mhd-offboarding-filter-search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="mhd-offboarding-filter-search"
              type="search"
              value={filters.searchTerm}
              onChange={(event) => update({ searchTerm: event.target.value })}
              placeholder="Person or reference…"
              className="w-full rounded-md border border-border bg-card py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        </div>

        {companyOptions.length > 0 ? (
          <MhdFilterSelect
            label="Company"
            id="mhd-offboarding-filter-company"
            value={filters.companyId}
            onChange={(event) => update({ companyId: event.target.value })}
          >
            <option value="ALL">All companies</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>
                {company.label}
              </option>
            ))}
          </MhdFilterSelect>
        ) : null}

        <MhdFilterSelect
          label="Person"
          id="mhd-offboarding-filter-person"
          value={filters.personId}
          onChange={(event) => update({ personId: event.target.value })}
        >
          <option value="ALL">All people</option>
          {peopleOptions.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Type"
          id="mhd-offboarding-filter-type"
          value={filters.separationType}
          onChange={(event) =>
            update({
              separationType: event.target
                .value as MhdOffboardingCaseBoardFilters['separationType'],
            })
          }
        >
          <option value="ALL">All types</option>
          {MHD_SEPARATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {mhdFormatSeparationType(type)}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Status"
          id="mhd-offboarding-filter-status"
          value={filters.status}
          onChange={(event) =>
            update({ status: event.target.value as MhdOffboardingCaseBoardFilters['status'] })
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatCaseStatus(status)}
            </option>
          ))}
        </MhdFilterSelect>

        <label className="flex min-w-36 flex-col gap-1" htmlFor="mhd-offboarding-filter-from">
          <span className="text-xs font-medium text-muted-foreground">Separation From</span>
          <input
            id="mhd-offboarding-filter-from"
            type="date"
            value={filters.from}
            onChange={(event) => update({ from: event.target.value })}
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <label className="flex min-w-36 flex-col gap-1" htmlFor="mhd-offboarding-filter-to">
          <span className="text-xs font-medium text-muted-foreground">Separation To</span>
          <input
            id="mhd-offboarding-filter-to"
            type="date"
            value={filters.to}
            onChange={(event) => update({ to: event.target.value })}
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            setFilters({
              ...DEFAULT_FILTERS,
              companyId: companyOptions.length > 0 ? 'ALL' : filters.companyId,
            })
          }
          className="pb-2 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Clear
        </button>
      </MhdCard>

      {casesQuery.isLoading ? (
        <MhdCard className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading offboarding cases…
        </MhdCard>
      ) : cases.length === 0 ? (
        <MhdCard className="border-dashed">
          <MhdEmptyState
            icon={DoorOpen}
            title="No offboarding cases found"
            description="No offboarding cases match the current filters."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Case</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Separation Date</MhdTh>
                <MhdTh>Last Working Day</MhdTh>
                <MhdTh>Required Items</MhdTh>
                <MhdTh>Outstanding Property</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {cases.map((offboardingCase) => {
                const isOverdue = mhdIsOffboardingCaseOverdue(offboardingCase);
                return (
                  <MhdTr key={offboardingCase.id}>
                    <MhdTd>
                      <Link
                        to={`/offboarding/${offboardingCase.id}`}
                        className="font-medium text-accent hover:text-accent-hover"
                      >
                        {offboardingCase.personDisplayName ?? 'Unknown person'}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {offboardingCase.referenceId}
                      </div>
                    </MhdTd>
                    <MhdTd>
                      <MhdSeparationTypeBadge separationType={offboardingCase.separationType} />
                    </MhdTd>
                    <MhdTd>
                      <MhdCaseStatusBadge status={offboardingCase.status} />
                    </MhdTd>
                    <MhdTd className="text-muted-foreground">
                      {formatDate(offboardingCase.separationDate)}
                    </MhdTd>
                    <MhdTd>
                      <span
                        className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
                      >
                        {isOverdue ? (
                          <AlarmClock className="h-4 w-4" aria-label="Past last working day" />
                        ) : null}
                        {formatDate(offboardingCase.lastWorkingDay)}
                      </span>
                    </MhdTd>
                    <MhdTd className="text-muted-foreground">
                      {offboardingCase.requiredDoneCount} / {offboardingCase.requiredTotalCount}{' '}
                      done
                    </MhdTd>
                    <MhdTd>
                      {offboardingCase.outstandingPropertyCount > 0 ? (
                        <span className="font-medium text-amber-700">
                          {offboardingCase.outstandingPropertyCount} issued
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </MhdTd>
                    <MhdTableActions
                      viewTo={`/offboarding/${offboardingCase.id}`}
                      editTo={canMutate ? `/offboarding/${offboardingCase.id}` : undefined}
                    />
                  </MhdTr>
                );
              })}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
