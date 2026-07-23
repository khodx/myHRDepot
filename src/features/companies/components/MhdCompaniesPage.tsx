import { useMemo, useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdCompanyDetailsPanel } from '@/features/companies/components/MhdCompanyDetailsPanel';
import { MhdCompanyForm } from '@/features/companies/components/MhdCompanyForm';
import { MhdCompanyList } from '@/features/companies/components/MhdCompanyList';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies, useMhdCreateCompany, useMhdUpdateCompany } from '@/features/companies/Hook';
import type { MhdCompany, MhdCompanyListFilters, MhdCreateCompanyInput, MhdUpdateCompanyInput } from '@/features/companies/Types';

export function MhdCompaniesPage() {
  const { profile } = useMhdAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<MhdCompany | null>(null);

  const filters = useMemo<MhdCompanyListFilters>(() => ({ searchTerm }), [searchTerm]);
  const actorUserId = profile?.userId ?? '';
  const companiesQuery = useMhdCompanies(filters);
  const createCompanyMutation = useMhdCreateCompany({ actorUserId });
  const updateCompanyMutation = useMhdUpdateCompany(selectedCompany?.id ?? '', { actorUserId });

  function handleCreateCompany(values: MhdCreateCompanyInput) {
    if (!actorUserId) return;
    createCompanyMutation.mutate(values, {
      onSuccess: (company) => setSelectedCompany(company),
    });
  }

  function handleUpdateCompany(values: MhdUpdateCompanyInput) {
    if (!selectedCompany || !actorUserId) return;
    updateCompanyMutation.mutate(values, {
      onSuccess: (company) => setSelectedCompany(company),
    });
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Companies"
        description="Companies are the tenant boundary for people, users, tasks, notes, attachments, and audit history."
        actions={<div className="text-sm text-muted-foreground">Signed in as {profile?.displayName ?? 'authorized user'}</div>}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <MhdCard>
            <div className="grid gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Search companies</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Company name"
                />
              </label>
            </div>
          </MhdCard>

          {companiesQuery.isLoading ? (
            <MhdCard className="p-8 text-center text-sm text-muted-foreground">Loading companies...</MhdCard>
          ) : companiesQuery.isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {companiesQuery.error instanceof Error ? companiesQuery.error.message : 'Unable to load companies.'}
            </div>
          ) : (
            <MhdCompanyList
              companies={companiesQuery.data ?? []}
              selectedCompanyId={selectedCompany?.id}
              onSelectCompany={setSelectedCompany}
            />
          )}
        </div>

        <div className="space-y-6">
          <MhdCard className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Create company</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create the tenant record before adding people or tasks.</p>
            <div className="mt-5">
              <MhdCompanyForm
                isSubmitting={createCompanyMutation.isPending}
                submitLabel="Create company"
                onSubmit={(values) => handleCreateCompany(values as MhdCreateCompanyInput)}
              />
            </div>
            {createCompanyMutation.isError ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {createCompanyMutation.error instanceof Error ? createCompanyMutation.error.message : 'Unable to create company.'}
              </p>
            ) : null}
          </MhdCard>

          <MhdCompanyDetailsPanel
            company={selectedCompany}
            isSubmitting={updateCompanyMutation.isPending}
            onUpdateCompany={handleUpdateCompany}
          />
        </div>
      </section>
    </div>
  );
}
