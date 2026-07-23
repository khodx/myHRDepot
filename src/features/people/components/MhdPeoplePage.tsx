import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
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
    <div className="space-y-6">
      <MhdPageHeader
        title="People"
        description="Manage the people records that will be assigned to companies and future tasks."
        actions={
          <Button onClick={() => { setEditingSelectedPerson(false); setIsFormOpen(true); }}>
            Add person
          </Button>
        }
      />

      <MhdCard className="grid gap-4 md:grid-cols-3">
        <MhdPersonCompanySelect
          companies={activeCompanies}
          includeAllOption
          label="Filter by company"
          value={peopleState.filters.companyId}
          onChange={(companyId) => peopleState.setFilters((current) => ({ ...current, companyId: companyId as typeof current.companyId }))}
        />
        <label className="block text-sm font-medium text-foreground md:col-span-2">
          Search people
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Search by name or email"
            value={peopleState.filters.searchTerm}
            onChange={(event) => peopleState.setFilters((current) => ({ ...current, searchTerm: event.target.value }))}
          />
        </label>
      </MhdCard>

      {peopleState.errorMessage ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{peopleState.errorMessage}</p> : null}
      {companiesQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {companiesQuery.error instanceof Error ? companiesQuery.error.message : 'Unable to load companies.'}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]">
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
  );
}
