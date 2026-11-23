import { useMemo, useState } from 'react';
import { Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { MhdFormIntakeDefaultPanel } from '@/components/ui/MhdFormIntakeDefaultPanel';
import { MHD_DRAFT_KINDS, MHD_DRAFT_NEW_KEY } from '@/features/drafts/Types';
import {
  useMhdAccommodationOptionCatalog,
  useMhdCreateAccommodationOptionCatalogEntry,
  useMhdForkAccommodationOptionCatalogEntry,
  useMhdUpdateAccommodationOptionCatalogEntry,
} from '../Hook';
import {
  MHD_ACCOMMODATION_FUNCTIONAL_LIMITATION_TAGS,
  MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES,
  mhdFormatAccommodationValue,
  type MhdAccommodationOptionCatalogCategory,
  type MhdAccommodationOptionCatalogEntry,
} from '../Types';
import { MhdAccommodationDraftModal } from './MhdAccommodationDraftModal';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

interface NewEntryDraft {
  optionType: string;
  descriptionTemplate: string;
  category: MhdAccommodationOptionCatalogCategory;
  functionalLimitationTags: string[];
  typicalCostRange: string;
  sortOrder: string;
  isGlobal: boolean;
}

const EMPTY_DRAFT: NewEntryDraft = {
  optionType: '',
  descriptionTemplate: '',
  category: 'OTHER',
  functionalLimitationTags: [],
  typicalCostRange: '',
  sortOrder: '100',
  isGlobal: false,
};

interface EditDraft {
  descriptionTemplate: string;
  category: MhdAccommodationOptionCatalogCategory;
  functionalLimitationTags: string[];
  typicalCostRange: string;
  sortOrder: string;
  isActive: boolean;
}

/**
 * A saved draft is the person's own earlier entry, but it is still checked against the current
 * vocabulary before it goes back into the form, so a retired category or tag is never restored.
 */
function restoredCategory(
  value: unknown,
  fallback: MhdAccommodationOptionCatalogCategory,
): MhdAccommodationOptionCatalogCategory {
  return MHD_ACCOMMODATION_OPTION_CATALOG_CATEGORIES.includes(
    value as MhdAccommodationOptionCatalogCategory,
  )
    ? (value as MhdAccommodationOptionCatalogCategory)
    : fallback;
}

function restoredTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (tag): tag is string =>
      typeof tag === 'string' &&
      (MHD_ACCOMMODATION_FUNCTIONAL_LIMITATION_TAGS as readonly string[]).includes(tag),
  );
}

function restoredText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * The functional-limitation checkboxes shared by the create and edit modals. The tags describe
 * what a catalog entry addresses in general, never a person, so they are safe to draft.
 */
function FunctionalLimitationTagsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Functional limitations addressed (optional)</legend>
      <MhdFormFieldStack className="mt-2">
        {MHD_ACCOMMODATION_FUNCTIONAL_LIMITATION_TAGS.map((tag) => (
          <label key={tag} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includes(tag)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, tag]
                    : value.filter((selectedTag) => selectedTag !== tag),
                )
              }
            />
            {mhdFormatAccommodationValue(tag)}
          </label>
        ))}
      </MhdFormFieldStack>
    </fieldset>
  );
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
 * governs which affordances render. Creating and editing an entry each open
 * in a modal with save and resume.
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

  const editingEntry = (catalog.data ?? []).find((entry) => entry.id === editingId) ?? null;

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
    if (!companyId) return false;
    if (!draft.optionType.trim() || !draft.descriptionTemplate.trim()) {
      throw new Error('Enter both an option type and a description template.');
    }
    await createEntry.mutateAsync({
      companyId: draft.isGlobal ? null : companyId,
      optionType: draft.optionType,
      descriptionTemplate: draft.descriptionTemplate,
      category: draft.category,
      functionalLimitationTags: draft.functionalLimitationTags,
      typicalCostRange: draft.typicalCostRange.trim() || null,
      sortOrder: draft.sortOrder.trim() ? Number(draft.sortOrder) : undefined,
    });
    setDraft(EMPTY_DRAFT);
  }

  function restoreNewEntry(payload: Record<string, unknown>) {
    setDraft({
      optionType: restoredText(payload.optionType, ''),
      descriptionTemplate: restoredText(payload.descriptionTemplate, ''),
      category: restoredCategory(payload.category, EMPTY_DRAFT.category),
      functionalLimitationTags: restoredTags(payload.functionalLimitationTags),
      typicalCostRange: restoredText(payload.typicalCostRange, ''),
      sortOrder: restoredText(payload.sortOrder, EMPTY_DRAFT.sortOrder),
      // Only a role that may publish to the global library gets the flag back.
      isGlobal: isPlatformAdminOrHrPartner && payload.isGlobal === true,
    });
  }

  function startEditing(entry: MhdAccommodationOptionCatalogEntry) {
    setEditingId(entry.id);
    setEditDraft({
      descriptionTemplate: entry.descriptionTemplate,
      category: entry.category,
      functionalLimitationTags: entry.functionalLimitationTags,
      typicalCostRange: entry.typicalCostRange ?? '',
      sortOrder: String(entry.sortOrder),
      isActive: entry.isActive,
    });
    setError(null);
  }

  function stopEditing() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function submitEdit() {
    if (!editingId || !editDraft) return false;
    await updateEntry.mutateAsync({
      entryId: editingId,
      descriptionTemplate: editDraft.descriptionTemplate,
      category: editDraft.category,
      functionalLimitationTags: editDraft.functionalLimitationTags,
      typicalCostRange: editDraft.typicalCostRange.trim() || null,
      sortOrder: editDraft.sortOrder.trim() ? Number(editDraft.sortOrder) : undefined,
      isActive: editDraft.isActive,
    });
  }

  function restoreEdit(payload: Record<string, unknown>) {
    setEditDraft((value) =>
      value
        ? {
            descriptionTemplate: restoredText(
              payload.descriptionTemplate,
              value.descriptionTemplate,
            ),
            category: restoredCategory(payload.category, value.category),
            functionalLimitationTags: restoredTags(payload.functionalLimitationTags),
            typicalCostRange: restoredText(payload.typicalCostRange, value.typicalCostRange),
            sortOrder: restoredText(payload.sortOrder, value.sortOrder),
            isActive: typeof payload.isActive === 'boolean' ? payload.isActive : value.isActive,
          }
        : value,
    );
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
            <Button onClick={() => setCreating(true)} className="h-9 px-3 text-[16.8px]">
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
        <MhdAccommodationDraftModal
          title="Add A Catalog Entry"
          draftKind={MHD_DRAFT_KINDS.accommodationOptionCatalog}
          draftKey={MHD_DRAFT_NEW_KEY}
          companyId={companyId}
          draftTitle={draft.optionType.trim() || undefined}
          getDraftValues={() => ({ ...draft })}
          onRestore={restoreNewEntry}
          submitLabel="Add Entry"
          pendingLabel="Adding…"
          isSubmitting={createEntry.isPending}
          onSubmit={submitNewEntry}
          onClose={() => {
            setCreating(false);
            setDraft(EMPTY_DRAFT);
          }}
        >
          <MhdFormFieldStack>
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
          </MhdFormFieldStack>
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
          <MhdFormFieldStack>
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
          </MhdFormFieldStack>
          <FunctionalLimitationTagsField
            value={draft.functionalLimitationTags}
            onChange={(next) => setDraft((value) => ({ ...value, functionalLimitationTags: next }))}
          />
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
        </MhdAccommodationDraftModal>
      ) : null}

      {editingId && editDraft ? (
        <MhdAccommodationDraftModal
          title={editingEntry ? `Edit ${editingEntry.optionType}` : 'Edit Catalog Entry'}
          draftKind={MHD_DRAFT_KINDS.accommodationOptionCatalog}
          draftKey={editingId}
          companyId={companyId}
          getDraftValues={() => ({ ...editDraft })}
          onRestore={restoreEdit}
          submitLabel="Save Changes"
          pendingLabel="Saving…"
          isSubmitting={updateEntry.isPending}
          onSubmit={submitEdit}
          onClose={stopEditing}
        >
          <MhdFormFieldStack>
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
                          category: event.target.value as MhdAccommodationOptionCatalogCategory,
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
                    value ? { ...value, typicalCostRange: event.target.value } : value,
                  )
                }
              />
            </label>
          </MhdFormFieldStack>
          <label className="block text-sm font-medium">
            Description template
            <textarea
              className={`mt-1 min-h-20 ${inputClass}`}
              value={editDraft.descriptionTemplate}
              onChange={(event) =>
                setEditDraft((value) =>
                  value ? { ...value, descriptionTemplate: event.target.value } : value,
                )
              }
            />
          </label>
          <FunctionalLimitationTagsField
            value={editDraft.functionalLimitationTags}
            onChange={(next) =>
              setEditDraft((value) =>
                value ? { ...value, functionalLimitationTags: next } : value,
              )
            }
          />
          <MhdFormFieldStack>
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
          </MhdFormFieldStack>
        </MhdAccommodationDraftModal>
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

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

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
                        {entry.functionalLimitationTags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {entry.functionalLimitationTags.map((tag) => (
                              <MhdBadge key={tag} variant="neutral">
                                {mhdFormatAccommodationValue(tag)}
                              </MhdBadge>
                            ))}
                          </div>
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
