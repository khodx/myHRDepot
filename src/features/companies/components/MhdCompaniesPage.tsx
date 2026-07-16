import { useMemo, useState } from 'react';
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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">My HR Depot</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Companies are the tenant boundary for people, users, tasks, notes, attachments, and audit history.
              </p>
            </div>
            <div className="text-sm text-slate-600">Signed in as {profile?.displayName ?? 'authorized user'}</div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Search companies</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Company name"
                  />
                </label>
              </div>
            </div>

            {companiesQuery.isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading companies...</div>
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
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Create company</h2>
              <p className="mt-1 text-sm text-slate-600">Create the tenant record before adding people or tasks.</p>
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
            </section>

            <MhdCompanyDetailsPanel
              company={selectedCompany}
              isSubmitting={updateCompanyMutation.isPending}
              onUpdateCompany={handleUpdateCompany}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
