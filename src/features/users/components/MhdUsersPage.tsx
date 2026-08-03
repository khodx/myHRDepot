import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPlatformUsers } from '@/features/users/Hook';
import { MhdUserList } from '@/features/users/components/MhdUserList';
import type { MhdUsersListFilters } from '@/features/users/Types';
import { cn } from '@/utils/cn';

export function MhdUsersPage() {
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const activeCompanies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const [filters, setFilters] = useState<MhdUsersListFilters>({ companyId: 'ALL', searchTerm: '' });
  const usersQuery = useMhdPlatformUsers(filters);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Users"
        description="Platform login accounts — their company, linked person record, and admin flag."
        actions={
          <Link
            to="/users/new"
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            Invite user
          </Link>
        }
      />

      <MhdFilterBar>
        <MhdFilterSelect
          label="Filter by company"
          value={filters.companyId}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              companyId: event.target.value as typeof current.companyId,
            }))
          }
        >
          <option value="ALL">All companies</option>
          {activeCompanies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.companyName}
            </option>
          ))}
        </MhdFilterSelect>
        <MhdFilterInput
          label="Search"
          placeholder="Search by email"
          value={filters.searchTerm}
          onChange={(event) => setFilters((current) => ({ ...current, searchTerm: event.target.value }))}
          className="lg:col-span-2"
        />
      </MhdFilterBar>

      {usersQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {usersQuery.error instanceof Error ? usersQuery.error.message : 'Unable to load users.'}
        </p>
      ) : null}
      {companiesQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {companiesQuery.error instanceof Error
            ? companiesQuery.error.message
            : 'Unable to load companies.'}
        </p>
      ) : null}

      <MhdUserList users={usersQuery.data ?? []} isLoading={usersQuery.isLoading} />
    </div>
  );
}
