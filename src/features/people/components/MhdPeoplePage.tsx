import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { MhdFilterBar, MhdFilterInput } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeople } from '@/features/people/Hook';
import { MhdPersonCompanySelect } from '@/features/people/components/MhdPersonCompanySelect';
import { MhdPersonList } from '@/features/people/components/MhdPersonList';

export function MhdPeoplePage() {
  // The companies schema has no is_active column and the companies feature
  // exposes a react-query list hook, so "active companies" is simply every
  // company returned for an empty search.
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const activeCompanies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const peopleState = useMhdPeople({ companyId: 'ALL', searchTerm: '' });

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="People"
        description="Manage the people records that will be assigned to companies and future tasks."
        actions={
          <Link
            to="/people/new"
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            Add person
          </Link>
        }
      />

      <MhdFilterBar>
        <MhdPersonCompanySelect
          companies={activeCompanies}
          includeAllOption
          label="Filter by company"
          value={peopleState.filters.companyId}
          onChange={(companyId) =>
            peopleState.setFilters((current) => ({
              ...current,
              companyId: companyId as typeof current.companyId,
            }))
          }
        />
        <MhdFilterInput
          label="Search"
          placeholder="Search by name or email"
          value={peopleState.filters.searchTerm}
          onChange={(event) =>
            peopleState.setFilters((current) => ({ ...current, searchTerm: event.target.value }))
          }
          className="lg:col-span-2"
        />
      </MhdFilterBar>

      {peopleState.errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {peopleState.errorMessage}
        </p>
      ) : null}
      {companiesQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {companiesQuery.error instanceof Error
            ? companiesQuery.error.message
            : 'Unable to load companies.'}
        </p>
      ) : null}

      <MhdPersonList
        people={peopleState.people}
        selectedPersonId={peopleState.selectedPersonId}
        isLoading={peopleState.isLoading}
        onSelectPerson={peopleState.setSelectedPersonId}
      />
    </div>
  );
}
