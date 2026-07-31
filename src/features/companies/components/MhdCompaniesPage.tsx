import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { cn } from '@/utils/cn';
import { MhdCompanyList } from '@/features/companies/components/MhdCompanyList';
import { useMhdCompanies } from '@/features/companies/Hook';
import type { MhdCompany, MhdCompanyListFilters } from '@/features/companies/Types';

export function MhdCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<MhdCompany | null>(null);

  const filters = useMemo<MhdCompanyListFilters>(() => ({ searchTerm }), [searchTerm]);
  const companiesQuery = useMhdCompanies(filters);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Companies"
        description="Companies are the tenant boundary for people, users, tasks, notes, attachments, and audit history."
        actions={
          <Link
            to="/companies/new"
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            New Company
          </Link>
        }
      />

      <MhdFilterBar>
        <MhdFilterInput
          label="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Company name"
          className="lg:col-span-2"
        />
      </MhdFilterBar>

      {companiesQuery.isLoading ? (
        <MhdCard className="p-8 text-center text-sm text-muted-foreground">
          Loading companies...
        </MhdCard>
      ) : companiesQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {companiesQuery.error instanceof Error
            ? companiesQuery.error.message
            : 'Unable to load companies.'}
        </div>
      ) : (
        <MhdCompanyList
          companies={companiesQuery.data ?? []}
          selectedCompanyId={selectedCompany?.id}
          onSelectCompany={(company) => {
            setSelectedCompany(company);
          }}
        />
      )}
    </div>
  );
}
