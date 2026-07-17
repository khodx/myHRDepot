import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateProperty } from '@/appshell/mhdRouteAccess';
import { type MhdCreatePropertyItemSchemaInput } from '../Schemas';
import { useMhdPropertyActions, useMhdPropertyItems } from '../Hook';
import { MHD_PROPERTY_CATEGORIES, MHD_PROPERTY_ITEM_STATUSES, type MhdPropertyListFilters } from '../Types';
import { MhdPropertyInventoryList } from './MhdPropertyInventoryList';
import { MhdPropertyItemForm } from './MhdPropertyItemForm';

const DEFAULT_FILTERS: MhdPropertyListFilters = {
  searchTerm: '',
  category: 'ALL',
  status: 'ALL',
};

export function MhdPropertyPage() {
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateProperty(roles);
  const [filters, setFilters] = useState<MhdPropertyListFilters>(DEFAULT_FILTERS);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const itemsQuery = useMhdPropertyItems(profile?.companyId ?? null);
  const actions = useMhdPropertyActions();

  const items = itemsQuery.data ?? [];
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      filters.searchTerm.trim().length === 0 ||
      item.name.toLowerCase().includes(filters.searchTerm.trim().toLowerCase()) ||
      item.referenceId.toLowerCase().includes(filters.searchTerm.trim().toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(filters.searchTerm.trim().toLowerCase()) === true;

    const matchesCategory = filters.category === 'ALL' || item.category === filters.category;
    const matchesStatus = filters.status === 'ALL' || item.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  async function handleCreate(input: MhdCreatePropertyItemSchemaInput) {
    setActionError(null);
    try {
      const item = await actions.createItem.mutateAsync(input);
      setIsCreateFormOpen(false);
      navigate(`/property/${item.id}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to create property item.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className="text-sm font-medium text-blue-700 hover:underline" to="/dashboard">Back to dashboard</Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-blue-700">My HR Depot</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Company Property</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Track inventory, issue property to employees, and maintain the full issue-to-return custody history.
            </p>
          </div>
          {canMutate && !isCreateFormOpen ? (
            <button
              type="button"
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              onClick={() => setIsCreateFormOpen(true)}
            >
              Add Property Item
            </button>
          ) : null}
        </div>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Search inventory
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Search by name, reference, or serial"
              value={filters.searchTerm}
              onChange={(event) => setFilters((current) => ({ ...current, searchTerm: event.target.value }))}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as MhdPropertyListFilters['category'] }))}
            >
              <option value="ALL">All categories</option>
              {MHD_PROPERTY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as MhdPropertyListFilters['status'] }))}
            >
              <option value="ALL">All statuses</option>
              {MHD_PROPERTY_ITEM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </section>

        {itemsQuery.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {itemsQuery.error instanceof Error ? itemsQuery.error.message : 'Unable to load property items.'}
          </div>
        ) : null}
        {actionError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div> : null}

        {isCreateFormOpen && profile?.companyId ? (
          <MhdPropertyItemForm
            companyId={profile.companyId}
            isSubmitting={actions.createItem.isPending}
            onSubmit={handleCreate}
            onCancel={() => {
              setActionError(null);
              setIsCreateFormOpen(false);
            }}
          />
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Inventory</h2>
              <p className="mt-1 text-sm text-slate-600">{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} in the filtered result set.</p>
            </div>
          </div>
        </div>

        <MhdPropertyInventoryList
          items={filteredItems}
          isLoading={itemsQuery.isLoading}
          canMutate={canMutate}
        />
      </div>
    </main>
  );
}
