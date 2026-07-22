import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeople } from '@/features/people/Hook';
import { MhdPersonCompanySelect } from '@/features/people/components/MhdPersonCompanySelect';
import { MhdPersonDetailsPanel } from '@/features/people/components/MhdPersonDetailsPanel';
import { MhdPersonForm } from '@/features/people/components/MhdPersonForm';
import { MhdPersonList } from '@/features/people/components/MhdPersonList';
import type { MhdCreatePersonInput, MhdUpdatePersonInput } from '@/features/people/Types';

export function MhdPeoplePage() {
  const { profile } = useMhdAuth();
  const actorUserId = profile?.userId ?? '';
  // The companies schema has no is_active column and the companies feature
  // exposes a react-query list hook, so "active companies" is simply every
  // company returned for an empty search.
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const activeCompanies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const peopleState = useMhdPeople({ companyId: 'ALL', searchTerm: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSelectedPerson, setEditingSelectedPerson] = useState(false);

  async function handleCreate(input: MhdCreatePersonInput) {
    await peopleState.createPerson(input, { actorUserId });
    setIsFormOpen(false);
  }

  async function handleUpdate(input: MhdUpdatePersonInput) {
    await peopleState.updatePerson(input, { actorUserId });
    setEditingSelectedPerson(false);
    setIsFormOpen(false);
  }

  const formPerson = editingSelectedPerson ? peopleState.selectedPerson : null;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className="text-sm font-medium text-blue-700 hover:underline" to="/dashboard">Back to dashboard</Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-blue-700">My HR Depot</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">People</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Manage the people records that will be assigned to companies and future tasks.</p>
          </div>
          <button type="button" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" onClick={() => { setEditingSelectedPerson(false); setIsFormOpen(true); }}>
            Add person
          </button>
        </div>

        <section className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-card p-4 shadow-sm md:grid-cols-3">
          <MhdPersonCompanySelect
            companies={activeCompanies}
            includeAllOption
            label="Filter by company"
            value={peopleState.filters.companyId}
            onChange={(companyId) => peopleState.setFilters((current) => ({ ...current, companyId: companyId as typeof current.companyId }))}
          />
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Search people
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Search by name or email"
              value={peopleState.filters.searchTerm}
              onChange={(event) => peopleState.setFilters((current) => ({ ...current, searchTerm: event.target.value }))}
            />
          </label>
        </section>

        {peopleState.errorMessage ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{peopleState.errorMessage}</p> : null}
        {companiesQuery.isError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {companiesQuery.error instanceof Error ? companiesQuery.error.message : 'Unable to load companies.'}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]">
          <MhdPersonList people={peopleState.people} selectedPersonId={peopleState.selectedPersonId} isLoading={peopleState.isLoading} onSelectPerson={peopleState.setSelectedPersonId} />
          {isFormOpen ? (
            <MhdPersonForm
              companies={activeCompanies}
              person={formPerson}
              defaultCompanyId={peopleState.filters.companyId}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onCancel={() => { setIsFormOpen(false); setEditingSelectedPerson(false); }}
            />
          ) : (
            <MhdPersonDetailsPanel person={peopleState.selectedPerson} onEdit={() => { setEditingSelectedPerson(true); setIsFormOpen(true); }} />
          )}
        </div>
      </div>
    </main>
  );
}
