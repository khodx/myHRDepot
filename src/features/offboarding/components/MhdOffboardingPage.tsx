import { AlarmClock, DoorOpen, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Offboarding</h1>
            <p className="mt-1 text-sm text-slate-600">
              Separation cases with an evidence-backed exit checklist: property, exit
              acknowledgment, access, final pay.
            </p>
          </div>

          {canMutate ? (
            <button
              type="button"
              onClick={() => setIsCreating((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Close Form' : 'New Case'}
            </button>
          ) : null}
        </div>

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
          <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.active}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Items Outstanding
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{counts.itemsOutstanding}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.completed}</p>
          </div>
        </div>

        {isCreating && canMutate && selectedCompanyId ? (
          <section className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">New Offboarding Case</h2>
            <MhdOffboardingCaseForm
              mode="create"
              companyId={selectedCompanyId}
              people={peopleOptions}
              onSubmit={handleCreateCase}
              onCancel={() => setIsCreating(false)}
              isSubmitting={actions.createCase.isPending}
            />
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label
                htmlFor="mhd-offboarding-filter-search"
                className="mb-1 block text-xs font-medium text-neutral-500"
              >
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="mhd-offboarding-filter-search"
                  type="search"
                  value={filters.searchTerm}
                  onChange={(event) => update({ searchTerm: event.target.value })}
                  placeholder="Person or reference…"
                  className="w-full rounded border py-2 pl-8 pr-3 text-sm"
                />
              </div>
            </div>

            {companyOptions.length > 0 ? (
              <div>
                <label
                  htmlFor="mhd-offboarding-filter-company"
                  className="mb-1 block text-xs font-medium text-neutral-500"
                >
                  Company
                </label>
                <select
                  id="mhd-offboarding-filter-company"
                  value={filters.companyId}
                  onChange={(event) => update({ companyId: event.target.value })}
                  className="rounded border px-3 py-2 text-sm"
                >
                  <option value="ALL">All companies</option>
                  {companyOptions.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="mhd-offboarding-filter-person"
                className="mb-1 block text-xs font-medium text-neutral-500"
              >
                Person
              </label>
              <select
                id="mhd-offboarding-filter-person"
                value={filters.personId}
                onChange={(event) => update({ personId: event.target.value })}
                className="rounded border px-3 py-2 text-sm"
              >
                <option value="ALL">All people</option>
                {peopleOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mhd-offboarding-filter-type"
                className="mb-1 block text-xs font-medium text-neutral-500"
              >
                Type
              </label>
              <select
                id="mhd-offboarding-filter-type"
                value={filters.separationType}
                onChange={(event) =>
                  update({
                    separationType: event.target
                      .value as MhdOffboardingCaseBoardFilters['separationType'],
                  })
                }
                className="rounded border px-3 py-2 text-sm"
              >
                <option value="ALL">All types</option>
                {MHD_SEPARATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {mhdFormatSeparationType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mhd-offboarding-filter-status"
                className="mb-1 block text-xs font-medium text-neutral-500"
              >
                Status
              </label>
              <select
                id="mhd-offboarding-filter-status"
                value={filters.status}
                onChange={(event) =>
                  update({ status: event.target.value as MhdOffboardingCaseBoardFilters['status'] })
                }
                className="rounded border px-3 py-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                {MHD_CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {mhdFormatCaseStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mhd-offboarding-filter-from"
                className="mb-1 block text-xs font-medium text-neutral-500"
              >
                Separation From
              </label>
              <input
                id="mhd-offboarding-filter-from"
                type="date"
                value={filters.from}
                onChange={(event) => update({ from: event.target.value })}
                className="rounded border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="mhd-offboarding-filter-to"
                className="mb-1 block text-xs font-medium text-neutral-500"
              >
                Separation To
              </label>
              <input
                id="mhd-offboarding-filter-to"
                type="date"
                value={filters.to}
                onChange={(event) => update({ to: event.target.value })}
                className="rounded border px-3 py-2 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setFilters({
                  ...DEFAULT_FILTERS,
                  companyId: companyOptions.length > 0 ? 'ALL' : filters.companyId,
                })
              }
              className="rounded border px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
          {casesQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Loading offboarding cases…
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
              <DoorOpen className="mb-2 h-8 w-8" />
              <p className="text-sm">No offboarding cases match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="py-2 pr-4">Case</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Separation Date</th>
                    <th className="py-2 pr-4">Last Working Day</th>
                    <th className="py-2 pr-4">Required Items</th>
                    <th className="py-2 pr-4">Outstanding Property</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((offboardingCase) => {
                    const isOverdue = mhdIsOffboardingCaseOverdue(offboardingCase);
                    return (
                      <tr
                        key={offboardingCase.id}
                        className="border-b last:border-0 hover:bg-neutral-50"
                      >
                        <td className="py-2 pr-4">
                          <Link
                            to={`/offboarding/${offboardingCase.id}`}
                            className="font-medium hover:underline"
                          >
                            {offboardingCase.personDisplayName ?? 'Unknown person'}
                          </Link>
                          <div className="text-xs text-neutral-400">
                            {offboardingCase.referenceId}
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <MhdSeparationTypeBadge separationType={offboardingCase.separationType} />
                        </td>
                        <td className="py-2 pr-4">
                          <MhdCaseStatusBadge status={offboardingCase.status} />
                        </td>
                        <td className="py-2 pr-4 text-neutral-600">
                          {formatDate(offboardingCase.separationDate)}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : 'text-neutral-600'}`}
                          >
                            {isOverdue ? (
                              <AlarmClock className="h-4 w-4" aria-label="Past last working day" />
                            ) : null}
                            {formatDate(offboardingCase.lastWorkingDay)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-neutral-600">
                          {offboardingCase.requiredDoneCount} / {offboardingCase.requiredTotalCount}{' '}
                          done
                        </td>
                        <td className="py-2 pr-4">
                          {offboardingCase.outstandingPropertyCount > 0 ? (
                            <span className="font-medium text-amber-700">
                              {offboardingCase.outstandingPropertyCount} issued
                            </span>
                          ) : (
                            <span className="text-neutral-400">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
