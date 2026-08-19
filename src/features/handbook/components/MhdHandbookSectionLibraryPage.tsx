import { useMemo, useState } from 'react';
import { mhdHandbookIsPrivileged, mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateHandbookSection,
  useMhdForkHandbookSection,
  useMhdHandbookSections,
  useMhdUpdateHandbookSection,
} from '../Hook';
import type {
  MhdCreateHandbookSectionFormValues,
  MhdUpdateHandbookSectionFormValues,
} from '../Schemas';
import {
  MHD_HANDBOOK_TYPES,
  mhdFormatHandbookJurisdiction,
  mhdFormatHandbookType,
  type MhdHandbookSection,
  type MhdHandbookType,
} from '../Types';
import { MhdHandbookSectionCreateForm } from './MhdHandbookSectionCreateForm';
import { MhdHandbookSectionEditForm } from './MhdHandbookSectionEditForm';

type MhdSectionDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; section: MhdHandbookSection }
  | null;

/**
 * `/handbooks/library` route entry — the clause library management surface.
 *
 * Route-entry page: reads `useMhdAuth()` itself, per the app convention (see
 * `MhdHandbooksPage`). Gated at the router to Platform Admin / HR Partner /
 * Client Admin (same set as `/handbooks`) — that guard is out of scope here, but
 * the affordances below still narrow further WITHIN that set:
 *
 * - Platform Admin / HR Partner (`mhdIsPlatformAdminOrHrPartner`) may create a
 *   section targeting EITHER tier (global library or this company) and may edit
 *   ANY row, global or company-owned.
 * - Client Admin (privileged per `mhdHandbookIsPrivileged` but not PA/HRP) may
 *   edit only their own company's rows, and may Fork a global row into a
 *   company-owned editable copy instead of editing it directly.
 *
 * Every affordance here is an AFFORDANCE, not the security boundary — the four
 * section RPCs (`mhd_create_handbook_section`, `mhd_update_handbook_section`,
 * `mhd_fork_handbook_section`, and the `p_company_id`-scoped
 * `mhd_handbook_section_list` read) all re-check the caller server-side
 * regardless of what this page offers.
 *
 * SHELL: every `bodyPlaceholder` here is attorney-flagged placeholder text, never
 * real legal content — the create/edit forms say so and this module never
 * authors a body itself.
 */
export function MhdHandbookSectionLibraryPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const canManageGlobal = mhdIsPlatformAdminOrHrPartner(roles);
  const canManageOwn = mhdHandbookIsPrivileged(roles);

  const [handbookType, setHandbookType] = useState<MhdHandbookType>('EMPLOYEE');
  const [dialogState, setDialogState] = useState<MhdSectionDialogState>(null);

  const sections = useMhdHandbookSections({ companyId: companyId || null, handbookType });
  const createSection = useMhdCreateHandbookSection();
  const updateSection = useMhdUpdateHandbookSection();
  const forkSection = useMhdForkHandbookSection();

  const byJurisdiction = useMemo(() => {
    const groups = new Map<string, MhdHandbookSection[]>();
    for (const section of sections.data ?? []) {
      const list = groups.get(section.jurisdiction) ?? [];
      list.push(section);
      groups.set(section.jurisdiction, list);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    }
    return [...groups.entries()];
  }, [sections.data]);

  function canEditRow(section: MhdHandbookSection): boolean {
    return section.isLibrary ? canManageGlobal : canManageOwn;
  }

  function canForkRow(section: MhdHandbookSection): boolean {
    // PA/HRP can already edit a library row directly — Fork exists for the
    // narrower Client Admin case, who cannot.
    return section.isLibrary && canManageOwn && !canManageGlobal;
  }

  async function handleCreate(values: MhdCreateHandbookSectionFormValues) {
    await createSection.mutateAsync({
      companyId: values.companyId,
      handbookType: values.handbookType,
      jurisdiction: values.jurisdiction,
      sectionKey: values.sectionKey,
      title: values.title,
      bodyPlaceholder: values.bodyPlaceholder,
      isRequired: values.isRequired,
      sortOrder: values.sortOrder,
    });
    setDialogState(null);
  }

  async function handleUpdate(values: MhdUpdateHandbookSectionFormValues) {
    await updateSection.mutateAsync(values);
    setDialogState(null);
  }

  async function handleFork(section: MhdHandbookSection) {
    const result = await forkSection.mutateAsync({ sourceSectionId: section.id, companyId });
    // Open the freshly minted company-owned copy for editing right away, per the
    // "fork then edit" flow. Pre-fill from the source's own fields — the fork RPC
    // clones them verbatim — rather than waiting on the invalidated list refetch.
    setDialogState({
      mode: 'edit',
      section: {
        ...section,
        id: result.id,
        companyId,
        isLibrary: false,
        sourceSectionId: section.id,
      },
    });
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">No company is associated with your account.</p>
      </div>
    );
  }

  const mutationError =
    createSection.error instanceof Error
      ? createSection.error.message
      : updateSection.error instanceof Error
        ? updateSection.error.message
        : forkSection.error instanceof Error
          ? forkSection.error.message
          : null;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Section Library"
        backTo="/handbooks"
        backLabel="Handbooks"
        description="The clause library handbooks assemble from. Global sections are shared across every company; company sections belong only to yours."
        actions={
          canManageGlobal ? (
            <Button onClick={() => setDialogState({ mode: 'create' })}>New Section</Button>
          ) : undefined
        }
      />

      <div className="flex gap-2">
        {MHD_HANDBOOK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setHandbookType(type)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              handbookType === type
                ? 'border-accent bg-accent-tint text-accent-hover'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {mhdFormatHandbookType(type)}
          </button>
        ))}
      </div>

      {mutationError ? (
        <p className="text-xs text-rose-600" role="alert">
          {mutationError}
        </p>
      ) : null}

      {sections.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : byJurisdiction.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections yet for this content pack.</p>
      ) : (
        <div className="space-y-6">
          {byJurisdiction.map(([jurisdiction, list]) => (
            <div key={jurisdiction} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {mhdFormatHandbookJurisdiction(jurisdiction)}
              </h3>
              <MhdCard className="overflow-hidden p-0">
                <MhdTable>
                  <thead>
                    <tr>
                      <MhdTh>Title</MhdTh>
                      <MhdTh>Key</MhdTh>
                      <MhdTh>Scope</MhdTh>
                      <MhdTh>Required</MhdTh>
                      <MhdTh>Sort</MhdTh>
                      <MhdTh />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((section) => (
                      <MhdTr key={section.id}>
                        <MhdTd className="font-medium">
                          {section.title}
                          {!section.isActive ? (
                            <MhdBadge variant="neutral" className="ml-2" hideIcon>
                              Inactive
                            </MhdBadge>
                          ) : null}
                        </MhdTd>
                        <MhdTd className="whitespace-nowrap font-mono text-xs">
                          {section.sectionKey}
                        </MhdTd>
                        <MhdTd>
                          <MhdBadge variant={section.isLibrary ? 'accent' : 'neutral'} hideIcon>
                            {section.isLibrary ? 'Global' : 'Company'}
                          </MhdBadge>
                        </MhdTd>
                        <MhdTd>
                          {section.isRequired ? (
                            <MhdBadge variant="neutral" hideIcon>
                              Required
                            </MhdBadge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Optional</span>
                          )}
                        </MhdTd>
                        <MhdTd className="text-muted-foreground">{section.sortOrder}</MhdTd>
                        <MhdTd className="whitespace-nowrap text-right">
                          <div className="flex justify-end gap-3">
                            {canEditRow(section) ? (
                              <button
                                type="button"
                                onClick={() => setDialogState({ mode: 'edit', section })}
                                className="text-sm font-medium text-accent hover:text-accent-hover"
                              >
                                Edit
                              </button>
                            ) : null}
                            {canForkRow(section) ? (
                              <button
                                type="button"
                                onClick={() => void handleFork(section)}
                                disabled={forkSection.isPending}
                                className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50"
                              >
                                Fork to My Company
                              </button>
                            ) : null}
                          </div>
                        </MhdTd>
                      </MhdTr>
                    ))}
                  </tbody>
                </MhdTable>
              </MhdCard>
            </div>
          ))}
        </div>
      )}

      {dialogState?.mode === 'create' ? (
        <MhdModal onClose={() => setDialogState(null)} title="New Section">
          <h2 className="mb-4 text-base font-semibold text-foreground">New Section</h2>
          <MhdHandbookSectionCreateForm
            companyId={companyId}
            canCreateGlobal={canManageGlobal}
            onSubmit={handleCreate}
            onCancel={() => setDialogState(null)}
            isSubmitting={createSection.isPending}
          />
        </MhdModal>
      ) : null}

      {dialogState?.mode === 'edit' ? (
        <MhdModal onClose={() => setDialogState(null)} title="Edit Section">
          <h2 className="mb-4 text-base font-semibold text-foreground">Edit Section</h2>
          <MhdHandbookSectionEditForm
            section={dialogState.section}
            onSubmit={handleUpdate}
            onCancel={() => setDialogState(null)}
            isSubmitting={updateSection.isPending}
          />
        </MhdModal>
      ) : null}
    </div>
  );
}
