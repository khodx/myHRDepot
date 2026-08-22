import { useMemo, useState } from 'react';
import { Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { MhdFormIntakeDefaultPanel } from '@/components/ui/MhdFormIntakeDefaultPanel';
import {
  useMhdAccommodationOptionCatalog,
  useMhdCreateAccommodationOptionCatalogEntry,
  useMhdForkAccommodationOptionCatalogEntry,
  useMhdUpdateAccommodationOptionCatalogEntry,
} from '../Hook';
import {
  MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES,
  mhdFormatAccommodationValue,
  type MhdAccommodationOptionCatalogCategory,
  type MhdAccommodationOptionCatalogEntry,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

interface NewEntryDraft {
  optionType: string;
  descriptionTemplate: string;
  category: MhdAccommodationOptionCatalogCategory;
  typicalCostRange: string;
  sortOrder: string;
  isGlobal: boolean;
}

const EMPTY_DRAFT: NewEntryDraft = {
  optionType: '',
  descriptionTemplate: '',
  category: 'OTHER',
  typicalCostRange: '',
  sortOrder: '100',
  isGlobal: false,
};

interface EditDraft {
  descriptionTemplate: string;
  category: MhdAccommodationOptionCatalogCategory;
  typicalCostRange: string;
  sortOrder: string;
  isActive: boolean;
}

/**
 * `/accommodations/option-library` — the reusable accommodation-option
 * catalog (0186_accommodation_option_catalog.sql). Entirely separate from a
 * case's own `accommodation_options`, which stays free-text and
 * case-specific: this is a library of common starting points a case's
 * option-evaluation step can copy from and then edit, never a constraint on
 * the case. Individualized analysis remains required per case regardless of
 * whether an option began from the catalog or from scratch.
 *
 * Edit gating mirrors `mhd_can_manage_accommodation_option_catalog`
 * server-side (Platform Admin/HR Partner for global rows, +Client Admin for
 * their own company's rows) — the RPC re-checks regardless, this only
 * governs which affordances render.
 */
export function MhdAccommodationOptionCatalogPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const isPlatformAdminOrHrPartner = mhdIsPlatformAdminOrHrPartner(roles);
  const canManageOwnCompanyEntries = isPlatformAdminOrHrPartner || roles.includes('Client Admin');

  const [categoryFilter, setCategoryFilter] = useState<
    MhdAccommodationOptionCatalogCategory | 'ALL'
  >('ALL');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<NewEntryDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const catalog = useMhdAccommodationOptionCatalog(
    companyId,
    categoryFilter === 'ALL' ? null : categoryFilter,
  );
  const createEntry = useMhdCreateAccommodationOptionCatalogEntry();
  const updateEntry = useMhdUpdateAccommodationOptionCatalogEntry();
  const forkEntry = useMhdForkAccommodationOptionCatalogEntry();

  const grouped = useMemo(() => {
    const map = new Map<string, MhdAccommodationOptionCatalogEntry[]>();
    for (const entry of catalog.data ?? []) {
      const bucket = map.get(entry.category) ?? [];
      bucket.push(entry);
      map.set(entry.category, bucket);
    }
    return Array.from(map.entries());
  }, [catalog.data]);

  function canManageEntry(entry: MhdAccommodationOptionCatalogEntry): boolean {
    return entry.isLibrary ? isPlatformAdminOrHrPartner : canManageOwnCompanyEntries;
  }

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  }

  async function submitNewEntry() {
    if (!companyId) return;
    if (!draft.optionType.trim() || !draft.descriptionTemplate.trim()) {
      setError('Enter both an option type and a description template.');
      return;
    }
    await run(async () => {
      await createEntry.mutateAsync({
        companyId: draft.isGlobal ? null : companyId,
        optionType: draft.optionType,
        descriptionTemplate: draft.descriptionTemplate,
        category: draft.category,
        typicalCostRange: draft.typicalCostRange.trim() || null,
        sortOrder: draft.sortOrder.trim() ? Number(draft.sortOrder) : undefined,
      });
      setDraft(EMPTY_DRAFT);
      setCreating(false);
    });
  }

  function startEditing(entry: MhdAccommodationOptionCatalogEntry) {
    setEditingId(entry.id);
    setEditDraft({
      descriptionTemplate: entry.descriptionTemplate,
      category: entry.category,
      typicalCostRange: entry.typicalCostRange ?? '',
      sortOrder: String(entry.sortOrder),
      isActive: entry.isActive,
    });
    setError(null);
  }

  async function submitEdit() {
    if (!editingId || !editDraft) return;
    await run(async () => {
      await updateEntry.mutateAsync({
        entryId: editingId,
        descriptionTemplate: editDraft.descriptionTemplate,
        category: editDraft.category,
        typicalCostRange: editDraft.typicalCostRange.trim() || null,
        sortOrder: editDraft.sortOrder.trim() ? Number(editDraft.sortOrder) : undefined,
        isActive: editDraft.isActive,
      });
      setEditingId(null);
      setEditDraft(null);
    });
  }

  async function fork(entry: MhdAccommodationOptionCatalogEntry) {
    if (!companyId) return;
    await run(() => forkEntry.mutateAsync({ sourceOptionId: entry.id, companyId }));
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/accommodations"
        backLabel="all accommodations"
        title="Accommodation Option Library"
        description="Reusable accommodation-type starting points a case's option-evaluation step can copy from and then edit. Never a constraint on the case — individualized analysis is still required for every decision."
        actions={
          companyId ? (
            <Button
              onClick={() => setCreating((value) => !value)}
              className="h-9 px-3 text-[16.8px]"
            >
              New Entry
            </Button>
          ) : undefined
        }
      />
      {mhdIsPlatformAdminOrHrPartner(roles) && companyId ? (
        <MhdFormIntakeDefaultPanel
          companyId={companyId}
          intakeKind="accommodationCase"
          label="Accommodation"
        />
      ) : null}

      {creating && companyId ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Add a catalog entry" />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Option type / title
              <input
                className={`mt-1 ${inputClass}`}
                value={draft.optionType}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, optionType: event.target.value }))
                }
                placeholder="e.g. Adjustable-height desk"
              />
            </label>
            <label className="text-sm font-medium">
              Category
              <select
                className={`mt-1 ${inputClass}`}
                value={draft.category}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    category: event.target.value as MhdAccommodationOptionCatalogCategory,
                  }))
                }
              >
                {MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {mhdFormatAccommodationValue(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Description template
            <textarea
              className={`mt-1 min-h-20 ${inputClass}`}
              value={draft.descriptionTemplate}
              onChange={(event) =>
                setDraft((value) => ({ ...value, descriptionTemplate: event.target.value }))
              }
              placeholder="A starting description a case can copy and edit for the specific employee/role."
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Typical cost range{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                className={`mt-1 ${inputClass}`}
                value={draft.typicalCostRange}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, typicalCostRange: event.target.value }))
                }
                placeholder="e.g. $0-$250"
              />
            </label>
            <label className="text-sm font-medium">
              Sort order
              <input
                type="number"
                className={`mt-1 ${inputClass}`}
                value={draft.sortOrder}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, sortOrder: event.target.value }))
                }
              />
            </label>
          </div>
          {isPlatformAdminOrHrPartner ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isGlobal}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, isGlobal: event.target.checked }))
                }
              />
              Add to the global library (visible to every company)
            </label>
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setDraft(EMPTY_DRAFT);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button disabled={createEntry.isPending} onClick={() => void submitNewEntry()}>
              {createEntry.isPending ? 'Adding…' : 'Add Entry'}
            </Button>
          </div>
        </MhdCard>
      ) : null}

      <MhdFilterBar>
        <MhdFilterSelect
          label="Category"
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value as MhdAccommodationOptionCatalogCategory | 'ALL')
          }
        >
          <option value="ALL">All categories</option>
          {MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {mhdFormatAccommodationValue(value)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {!creating && error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {catalog.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading option library…</p>
      ) : grouped.length === 0 ? (
        <MhdEmptyState
          icon={Library}
          title="No catalog entries"
          description="Add a reusable starting point that a case's option-evaluation step can copy from."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, entries]) => (
            <section key={category} className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">
                {mhdFormatAccommodationValue(category)}
              </h2>
              <ul className="space-y-3">
                {entries.map((entry) => (
                  <li key={entry.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.optionType}
                          {entry.isLibrary ? (
                            <MhdBadge variant="info" className="ml-2">
                              Global
                            </MhdBadge>
                          ) : (
                            <MhdBadge variant="neutral" className="ml-2">
                              Company
                            </MhdBadge>
                          )}
                          {!entry.isActive ? (
                            <MhdBadge variant="neutral" className="ml-2">
                              Inactive
                            </MhdBadge>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.descriptionTemplate}
                        </p>
                        {entry.typicalCostRange ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Typical cost: {entry.typicalCostRange}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {entry.isLibrary && canManageOwnCompanyEntries ? (
                          <Button
                            variant="secondary"
                            disabled={forkEntry.isPending}
                            onClick={() => void fork(entry)}
                            className="h-8 px-3 text-xs"
                          >
                            Fork To My Company
                          </Button>
                        ) : null}
                        {canManageEntry(entry) ? (
                          <Button
                            variant="secondary"
                            onClick={() => startEditing(entry)}
                            className="h-8 px-3 text-xs"
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {editingId === entry.id && editDraft ? (
                      <div className="mt-4 space-y-3 border-t border-border pt-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-sm font-medium">
                            Category
                            <select
                              className={`mt-1 ${inputClass}`}
                              value={editDraft.category}
                              onChange={(event) =>
                                setEditDraft((value) =>
                                  value
                                    ? {
                                        ...value,
                                        category: event.target
                                          .value as MhdAccommodationOptionCatalogCategory,
                                      }
                                    : value,
                                )
                              }
                            >
                              {MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES.map((value) => (
                                <option key={value} value={value}>
                                  {mhdFormatAccommodationValue(value)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm font-medium">
                            Typical cost range
                            <input
                              className={`mt-1 ${inputClass}`}
                              value={editDraft.typicalCostRange}
                              onChange={(event) =>
                                setEditDraft((value) =>
                                  value
                                    ? { ...value, typicalCostRange: event.target.value }
                                    : value,
                                )
                              }
                            />
                          </label>
                        </div>
                        <label className="block text-sm font-medium">
                          Description template
                          <textarea
                            className={`mt-1 min-h-20 ${inputClass}`}
                            value={editDraft.descriptionTemplate}
                            onChange={(event) =>
                              setEditDraft((value) =>
                                value
                                  ? { ...value, descriptionTemplate: event.target.value }
                                  : value,
                              )
                            }
                          />
                        </label>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-sm font-medium">
                            Sort order
                            <input
                              type="number"
                              className={`mt-1 ${inputClass}`}
                              value={editDraft.sortOrder}
                              onChange={(event) =>
                                setEditDraft((value) =>
                                  value ? { ...value, sortOrder: event.target.value } : value,
                                )
                              }
                            />
                          </label>
                          <label className="mt-6 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editDraft.isActive}
                              onChange={(event) =>
                                setEditDraft((value) =>
                                  value ? { ...value, isActive: event.target.checked } : value,
                                )
                              }
                            />
                            Active
                          </label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={updateEntry.isPending}
                            onClick={() => void submitEdit()}
                          >
                            {updateEntry.isPending ? 'Saving…' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
