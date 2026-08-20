import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdChecklistLibrary,
  useMhdChecklistPeople,
  useMhdCreateChecklistInstance,
  useMhdCreateChecklistTemplate,
  useMhdForkChecklistTemplate,
} from '../Hook';
import {
  MHD_CHECKLIST_CATEGORIES,
  mhdFormatChecklistValue,
  type MhdChecklistCategory,
  type MhdChecklistTemplate,
  type MhdChecklistTemplateItemDraft,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const EMPTY_ITEM: MhdChecklistTemplateItemDraft = {
  title: '',
  description: '',
  isRequired: true,
  requiresEvidence: false,
  sortOrder: 100,
};

export function MhdChecklistLibraryPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canManageGlobal = mhdIsPlatformAdminOrHrPartner(roles);
  const canManageOwn = canManageGlobal || roles.includes('Client Admin');
  const [category, setCategory] = useState<MhdChecklistCategory | 'ALL'>('ALL');
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<MhdChecklistTemplate | null>(null);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    category: 'GENERAL' as MhdChecklistCategory,
    isGlobal: false,
    items: [{ ...EMPTY_ITEM }],
  });
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const library = useMhdChecklistLibrary(companyId, category === 'ALL' ? null : category);
  const people = useMhdChecklistPeople(companyId);
  const createTemplate = useMhdCreateChecklistTemplate();
  const forkTemplate = useMhdForkChecklistTemplate();
  const assignInstance = useMhdCreateChecklistInstance();

  const grouped = useMemo(() => {
    const groups = new Map<string, MhdChecklistTemplate[]>();
    for (const template of library.data ?? []) {
      const bucket = groups.get(template.category) ?? [];
      bucket.push(template);
      groups.set(template.category, bucket);
    }
    return [...groups.entries()];
  }, [library.data]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  }

  async function submitTemplate() {
    if (!companyId || !draft.title.trim()) return;
    const items = draft.items
      .map((item, index) => ({ ...item, sortOrder: index + 1 }))
      .filter((item) => item.title.trim());
    if (items.length === 0) {
      setError('Add at least one checklist item.');
      return;
    }
    await run(async () => {
      await createTemplate.mutateAsync({
        companyId: draft.isGlobal ? null : companyId,
        title: draft.title,
        description: draft.description || null,
        category: draft.category,
        items,
      });
      setCreating(false);
      setDraft({ title: '', description: '', category: 'GENERAL', isGlobal: false, items: [{ ...EMPTY_ITEM }] });
    });
  }

  async function submitAssignment() {
    if (!companyId || !assigning || !assigneeId) return;
    await run(async () => {
      await assignInstance.mutateAsync({
        companyId,
        templateId: assigning.id,
        title: assigning.title,
        assignedToPersonId: assigneeId,
        dueDate: dueDate || null,
      });
      setAssigning(null);
      setAssigneeId('');
      setDueDate('');
    });
  }

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">No company is associated with your account.</p>;
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Checklist Library"
        description="Reusable checklist templates for company assignments."
        actions={canManageOwn ? <Button onClick={() => setCreating(true)}>New Template</Button> : undefined}
      />

      <MhdFilterBar>
        <MhdFilterSelect
          label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value as MhdChecklistCategory | 'ALL')}
        >
          <option value="ALL">All categories</option>
          {MHD_CHECKLIST_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {mhdFormatChecklistValue(value)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {library.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading checklist library...</p>
      ) : grouped.length === 0 ? (
        <MhdEmptyState icon={ClipboardList} title="No checklist templates" description="Add a reusable checklist template for this company." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([group, templates]) => (
            <section key={group} className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">{mhdFormatChecklistValue(group)}</h2>
              <MhdCard className="overflow-hidden p-0">
                <MhdTable>
                  <thead>
                    <tr>
                      <MhdTh>Template</MhdTh>
                      <MhdTh>Scope</MhdTh>
                      <MhdTh>Items</MhdTh>
                      <MhdTh />
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <MhdTr key={template.id}>
                        <MhdTd>
                          <p className="font-medium">{template.title}</p>
                          {template.description ? <p className="text-xs text-muted-foreground">{template.description}</p> : null}
                        </MhdTd>
                        <MhdTd>
                          <MhdBadge variant={template.isLibrary ? 'accent' : 'neutral'} hideIcon>
                            {template.isLibrary ? 'Global' : 'Company'}
                          </MhdBadge>
                        </MhdTd>
                        <MhdTd>{template.itemCount}</MhdTd>
                        <MhdTd className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setAssigning(template)}>
                              Assign
                            </Button>
                            {template.isLibrary && canManageOwn ? (
                              <Button
                                variant="secondary"
                                className="h-8 px-3 text-xs"
                                disabled={forkTemplate.isPending}
                                onClick={() => void run(() => forkTemplate.mutateAsync({ sourceTemplateId: template.id, companyId }))}
                              >
                                Fork to My Company
                              </Button>
                            ) : null}
                          </div>
                        </MhdTd>
                      </MhdTr>
                    ))}
                  </tbody>
                </MhdTable>
              </MhdCard>
            </section>
          ))}
        </div>
      )}

      {creating ? (
        <MhdModal title="New checklist template" onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <MhdCardHeader title="New checklist template" />
            <input className={inputClass} placeholder="Template title" value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} />
            <textarea className={`${inputClass} min-h-20`} placeholder="Description" value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} />
            <select className={inputClass} value={draft.category} onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value as MhdChecklistCategory }))}>
              {MHD_CHECKLIST_CATEGORIES.map((value) => <option key={value} value={value}>{mhdFormatChecklistValue(value)}</option>)}
            </select>
            {canManageGlobal ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.isGlobal} onChange={(event) => setDraft((value) => ({ ...value, isGlobal: event.target.checked }))} />
                Add to the global library
              </label>
            ) : null}
            <div className="space-y-2">
              {draft.items.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_auto_auto_auto]">
                  <input className={inputClass} placeholder="Item title" value={item.title} onChange={(event) => setDraft((value) => ({ ...value, items: value.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row) }))} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.isRequired} onChange={(event) => setDraft((value) => ({ ...value, items: value.items.map((row, rowIndex) => rowIndex === index ? { ...row, isRequired: event.target.checked } : row) }))} />Required</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.requiresEvidence} onChange={(event) => setDraft((value) => ({ ...value, items: value.items.map((row, rowIndex) => rowIndex === index ? { ...row, requiresEvidence: event.target.checked } : row) }))} />Evidence</label>
                  <Button variant="secondary" onClick={() => setDraft((value) => ({ ...value, items: value.items.filter((_, rowIndex) => rowIndex !== index) }))}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setDraft((value) => ({ ...value, items: [...value.items, { ...EMPTY_ITEM }] }))}>Add Item</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button disabled={createTemplate.isPending} onClick={() => void submitTemplate()}>{createTemplate.isPending ? 'Saving...' : 'Save Template'}</Button>
            </div>
          </div>
        </MhdModal>
      ) : null}

      {assigning ? (
        <MhdModal title="Assign checklist" onClose={() => setAssigning(null)}>
          <div className="space-y-4">
            <MhdCardHeader title={`Assign ${assigning.title}`} />
            <select className={inputClass} value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <option value="">Choose a person...</option>
              {(people.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}
            </select>
            <input type="date" className={inputClass} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssigning(null)}>Cancel</Button>
              <Button disabled={!assigneeId || assignInstance.isPending} onClick={() => void submitAssignment()}>{assignInstance.isPending ? 'Assigning...' : 'Assign Checklist'}</Button>
            </div>
          </div>
        </MhdModal>
      ) : null}
    </div>
  );
}
