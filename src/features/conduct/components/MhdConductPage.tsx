import { Gavel, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
function MhdConductCaseCreateForm({
  companyId,
  people,
  onSubmit,
  onCancel,
  isSubmitting,
}: CaseCreateFormProps) {
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
          <select
            id="mhd-conduct-form-person"
            className="w-full rounded border px-3 py-2"
            {...register('personId')}
          >
            <option value="">Select person…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          {errors.personId ? (
            <p className="mt-1 text-xs text-red-600">{errors.personId.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mhd-conduct-form-category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="mhd-conduct-form-category"
            className="w-full rounded border px-3 py-2"
            {...register('category')}
          >
            {MHD_CONDUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {mhdFormatConductCategory(category)}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
          ) : null}
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
        {errors.concernSummary ? (
          <p className="mt-1 text-xs text-red-600">{errors.concernSummary.message}</p>
        ) : null}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Opening…' : 'Open Conduct Case'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
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
      : (profile?.companyId ?? null)
    : (profile?.companyId ?? null);

  const effectiveFilters = useMemo<MhdConductCaseFilters>(
    () => ({
      ...filters,
      companyId: canCrossCompanyFilter ? (selectedCompanyId ?? '') : (profile?.companyId ?? ''),
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
        (total, conductCase) =>
          total + Math.max(conductCase.actionCount - conductCase.terminalCount, 0),
        0,
      ),
      closed: cases.filter((conductCase) => conductCase.status === 'CLOSED').length,
    };
  }, [cases]);

  const companyOptions = canCrossCompanyFilter
    ? (companiesQuery.data ?? []).map((company) => ({ id: company.id, label: company.companyName }))
    : [];
  const peopleOptions = (peopleQuery.data ?? []).map((person) => ({
    id: person.id,
    label: person.displayName,
  }));

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
    <div className="space-y-6">
      <MhdPageHeader
        title="Conduct"
        description="Corrective-action records: verbal, written, and final warnings and MOUs, each generated, routed for acknowledgment of receipt, and recorded with refusal as a first-class outcome."
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
            : 'Unable to load conduct cases.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MhdCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Open
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{counts.open}</p>
        </MhdCard>
        <MhdCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Actions Outstanding
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
            {counts.actionsOutstanding}
          </p>
        </MhdCard>
        <MhdCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Closed
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{counts.closed}</p>
        </MhdCard>
      </div>

      {isCreating && canMutate && selectedCompanyId ? (
        <MhdCard>
          <MhdCardHeader title="New Conduct Case" />
          <MhdConductCaseCreateForm
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
            htmlFor="mhd-conduct-filter-search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="mhd-conduct-filter-search"
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
            id="mhd-conduct-filter-company"
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
          id="mhd-conduct-filter-person"
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
          label="Category"
          id="mhd-conduct-filter-category"
          value={filters.category}
          onChange={(event) =>
            update({ category: event.target.value as MhdConductCaseFilters['category'] })
          }
        >
          <option value="ALL">All categories</option>
          {MHD_CONDUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {mhdFormatConductCategory(category)}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Status"
          id="mhd-conduct-filter-status"
          value={filters.status}
          onChange={(event) =>
            update({ status: event.target.value as MhdConductCaseFilters['status'] })
          }
        >
          <option value="ALL">All statuses</option>
          {MHD_CONDUCT_CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {mhdFormatConductCaseStatus(status)}
            </option>
          ))}
        </MhdFilterSelect>

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
          Loading conduct cases…
        </MhdCard>
      ) : cases.length === 0 ? (
        <MhdCard className="border-dashed">
          <MhdEmptyState
            icon={Gavel}
            title="No conduct cases found"
            description="No conduct cases match the current filters."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Case</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Actions</MhdTh>
                <MhdTh>Opened</MhdTh>
              </tr>
            </thead>
            <tbody>
              {cases.map((conductCase) => (
                <MhdTr key={conductCase.id}>
                  <MhdTd>
                    <Link
                      to={`/conduct/${conductCase.id}`}
                      state={{ companyId: effectiveFilters.companyId }}
                      className="font-medium text-accent hover:text-accent-hover"
                    >
                      {conductCase.personDisplayName ?? 'Unknown person'}
                    </Link>
                    <div className="text-xs text-muted-foreground">{conductCase.referenceId}</div>
                  </MhdTd>
                  <MhdTd className="text-muted-foreground">
                    {mhdFormatConductCategory(conductCase.category)}
                  </MhdTd>
                  <MhdTd>
                    <MhdConductCaseStatusBadge status={conductCase.status} />
                  </MhdTd>
                  <MhdTd className="text-muted-foreground">
                    {conductCase.terminalCount} / {conductCase.actionCount} terminal
                  </MhdTd>
                  <MhdTd className="text-muted-foreground">
                    {new Date(conductCase.createdAt).toLocaleDateString()}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
