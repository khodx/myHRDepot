import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateProperty } from '@/appshell/mhdRouteAccess';
import { type MhdCreatePropertyItemSchemaInput } from '../Schemas';
import { useMhdPropertyActions, useMhdPropertyItems } from '../Hook';
import {
  MHD_PROPERTY_CATEGORIES,
  MHD_PROPERTY_ITEM_STATUSES,
  type MhdPropertyListFilters,
} from '../Types';
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
    <div className="space-y-6">
      <MhdPageHeader
        title="Company Property"
        description="Track inventory, issue property to employees, and maintain the full issue-to-return custody history."
        actions={
          canMutate && !isCreateFormOpen ? (
            <Button type="button" onClick={() => setIsCreateFormOpen(true)}>
              Add Property Item
            </Button>
          ) : undefined
        }
      />

      <MhdCard className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium text-foreground md:col-span-1">
          Search inventory
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Search by name, reference, or serial"
            value={filters.searchTerm}
            onChange={(event) =>
              setFilters((current) => ({ ...current, searchTerm: event.target.value }))
            }
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Category
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value as MhdPropertyListFilters['category'],
              }))
            }
          >
            <option value="ALL">All categories</option>
            {MHD_PROPERTY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Status
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as MhdPropertyListFilters['status'],
              }))
            }
          >
            <option value="ALL">All statuses</option>
            {MHD_PROPERTY_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </MhdCard>

      {itemsQuery.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {itemsQuery.error instanceof Error
            ? itemsQuery.error.message
            : 'Unable to load property items.'}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

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

      <MhdCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Inventory
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} in the filtered
              result set.
            </p>
          </div>
        </div>
      </MhdCard>

      <MhdPropertyInventoryList
        items={filteredItems}
        isLoading={itemsQuery.isLoading}
        canMutate={canMutate}
      />
    </div>
  );
}
