import { Gavel, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mhdCanMutateConduct } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mhdConductCaseFormSchema, type MhdConductCaseFormSchemaInput } from '../Schemas';
import { useMhdConductActionsMutations, useMhdConductCases, useMhdConductPeople } from '../Hook';
import {
  MHD_CONDUCT_CASE_STATUSES,
  MHD_CONDUCT_CATEGORIES,
  type MhdConductCaseFilters,
  mhdFormatConductCaseStatus,
  mhdFormatConductCategory,
} from '../Types';
import { MhdConductCaseStatusBadge } from './MhdConductCaseStatusBadge';

const DEFAULT_FILTERS: MhdConductCaseFilters = {
  companyId: '',
  personId: 'ALL',
  category: 'ALL',
  status: 'ALL',
  searchTerm: '',
};

interface CaseCreateFormProps {
  companyId: string;
  people: Array<{ id: string; label: string }>;
  onSubmit: (input: MhdConductCaseFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/** Inline open-a-case form. The subject and category are fixed at creation. */
function MhdConductCaseCreateForm({ companyId, people, onSubmit, onCancel, isSubmitting }: CaseCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdConductCaseFormSchemaInput>({
    resolver: zodResolver(mhdConductCaseFormSchema),
    defaultValues: { companyId, category: 'CONDUCT' },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="mhd-conduct-form-person" className="mb-1 block text-sm font-medium">
            Subject Employee
          </label>
          <select id="mhd-conduct-form-person" className="w-full rounded border px-3 py-2" {...register('personId')}>
            <option value="">Select person…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          {errors.personId ? <p className="mt-1 text-xs text-red-600">{errors.personId.message}</p> : null}
        </div>

        <div>
          <label htmlFor="mhd-conduct-form-category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select id="mhd-conduct-form-category" className="w-full rounded border px-3 py-2" {...register('category')}>
            {MHD_CONDUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {mhdFormatConductCategory(category)}
              </option>
            ))}
          </select>
          {errors.category ? <p className="mt-1 text-xs text-red-600">{errors.category.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="mhd-conduct-form-concern" className="mb-1 block text-sm font-medium">
          Concern Summary
        </label>
        <textarea
          id="mhd-conduct-form-concern"
          className="w-full rounded border px-3 py-2"
          rows={3}
          placeholder="Why the case exists — sensitive. The subject sees this only once an action is issued."
          {...register('concernSummary')}
        />
        {errors.concernSummary ? <p className="mt-1 text-xs text-red-600">{errors.concernSummary.message}</p> : null}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Opening…' : 'Open Conduct Case'}
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

/**
 * /conduct — the case board. The route admits Platform Admin, HR Partner, and
 * Client Admin only (strictest module, matching Offboarding: no Client User, no
 * Viewer, and — critically — no subject). The subject employee never reaches a
 * Conduct route; they see their corrective-action document only through the
 * signing link delivered by notification. So no read-only/subject rendering is
 * needed here; mhdCanMutateConduct gates the mutating affordances.
 */
export function MhdConductPage() {
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateConduct(roles);
  const canCrossCompanyFilter = roles.includes('Platform Admin') || roles.includes('HR Partner');

  const [filters, setFilters] = useState<MhdConductCaseFilters>(DEFAULT_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedCompanyId = canCrossCompanyFilter
    ? filters.companyId !== '' && filters.companyId !== 'ALL'
      ? filters.companyId
      : profile?.companyId ?? null
    : profile?.companyId ?? null;

  const effectiveFilters = useMemo<MhdConductCaseFilters>(
    () => ({
      ...filters,
      companyId: canCrossCompanyFilter ? (selectedCompanyId ?? '') : profile?.companyId ?? '',
    }),
    [canCrossCompanyFilter, filters, profile?.companyId, selectedCompanyId],
  );

  const casesQuery = useMhdConductCases(effectiveFilters);
  const actions = useMhdConductActionsMutations();
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const peopleQuery = useMhdConductPeople(selectedCompanyId);

  const cases = useMemo(() => casesQuery.data ?? [], [casesQuery.data]);

  const counts = useMemo(() => {
    const open = cases.filter((conductCase) => conductCase.status === 'OPEN');
    return {
      open: open.length,
      actionsOutstanding: open.reduce(
        (total, conductCase) => total + Math.max(conductCase.actionCount - conductCase.terminalCount, 0),
        0,
      ),
      closed: cases.filter((conductCase) => conductCase.status === 'CLOSED').length,
    };
  }, [cases]);

  const companyOptions = canCrossCompanyFilter
    ? (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.companyName }))
    : [];
  const peopleOptions = (peopleQuery.data ?? []).map((person) => ({ id: person.id, label: person.displayName }));

  function update(patch: Partial<MhdConductCaseFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function handleCreateCase(input: MhdConductCaseFormSchemaInput) {
    setActionError(null);
    try {
      await actions.createCase.mutateAsync({
        companyId: input.companyId,
        personId: input.personId,
        category: input.category,
        concernSummary: input.concernSummary,
      });
      setIsCreating(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to open the conduct case.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Conduct</h1>
            <p className="mt-1 text-sm text-slate-600">
              Corrective-action records: verbal, written, and final warnings and MOUs, each generated, routed for
              acknowledgment of receipt, and recorded with refusal as a first-class outcome.
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

        {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}
        {casesQuery.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {casesQuery.error instanceof Error ? casesQuery.error.message : 'Unable to load conduct cases.'}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.open}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{counts.actionsOutstanding}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Closed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.closed}</p>
          </div>
        </div>

        {isCreating && canMutate && selectedCompanyId ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">New Conduct Case</h2>
            <MhdConductCaseCreateForm
              companyId={selectedCompanyId}
              people={peopleOptions}
              onSubmit={handleCreateCase}
              onCancel={() => setIsCreating(false)}
              isSubmitting={actions.createCase.isPending}
            />
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="mhd-conduct-filter-search" className="mb-1 block text-xs font-medium text-neutral-500">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  id="mhd-conduct-filter-search"
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
                <label htmlFor="mhd-conduct-filter-company" className="mb-1 block text-xs font-medium text-neutral-500">
                  Company
                </label>
                <select
                  id="mhd-conduct-filter-company"
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
              <label htmlFor="mhd-conduct-filter-person" className="mb-1 block text-xs font-medium text-neutral-500">
                Person
              </label>
              <select
                id="mhd-conduct-filter-person"
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
              <label htmlFor="mhd-conduct-filter-category" className="mb-1 block text-xs font-medium text-neutral-500">
                Category
              </label>
              <select
                id="mhd-conduct-filter-category"
                value={filters.category}
                onChange={(event) => update({ category: event.target.value as MhdConductCaseFilters['category'] })}
                className="rounded border px-3 py-2 text-sm"
              >
                <option value="ALL">All categories</option>
                {MHD_CONDUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {mhdFormatConductCategory(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mhd-conduct-filter-status" className="mb-1 block text-xs font-medium text-neutral-500">
                Status
              </label>
              <select
                id="mhd-conduct-filter-status"
                value={filters.status}
                onChange={(event) => update({ status: event.target.value as MhdConductCaseFilters['status'] })}
                className="rounded border px-3 py-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                {MHD_CONDUCT_CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {mhdFormatConductCaseStatus(status)}
                  </option>
                ))}
              </select>
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

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {casesQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading conduct cases…</div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
              <Gavel className="mb-2 h-8 w-8" />
              <p className="text-sm">No conduct cases match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="py-2 pr-4">Case</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                    <th className="py-2 pr-4">Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((conductCase) => (
                    <tr key={conductCase.id} className="border-b last:border-0 hover:bg-neutral-50">
                      <td className="py-2 pr-4">
                        <Link
                          to={`/conduct/${conductCase.id}`}
                          state={{ companyId: effectiveFilters.companyId }}
                          className="font-medium hover:underline"
                        >
                          {conductCase.personDisplayName ?? 'Unknown person'}
                        </Link>
                        <div className="text-xs text-neutral-400">{conductCase.referenceId}</div>
                      </td>
                      <td className="py-2 pr-4 text-neutral-600">{mhdFormatConductCategory(conductCase.category)}</td>
                      <td className="py-2 pr-4">
                        <MhdConductCaseStatusBadge status={conductCase.status} />
                      </td>
                      <td className="py-2 pr-4 text-neutral-600">
                        {conductCase.terminalCount} / {conductCase.actionCount} terminal
                      </td>
                      <td className="py-2 pr-4 text-neutral-600">
                        {new Date(conductCase.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
