import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateTrainingTemplate,
  useMhdCreateTrainingTemplateSlot,
  useMhdDeleteTrainingTemplate,
  useMhdDeleteTrainingTemplateSlot,
  useMhdTrainingTemplateSlots,
  useMhdTrainingTemplates,
  useMhdUpdateTrainingTemplate,
  useMhdUpdateTrainingTemplateSlot,
} from '../Hook';
import {
  MHD_TRAINING_TEMPLATE_BLOCK_TYPES,
  mhdFormatTrainingBlockType,
  mhdFormatTrainingTemplateRigidity,
  type MhdTrainingTemplate,
  type MhdTrainingTemplateSlot,
  type MhdTrainingBlockType,
} from '../Types';

export function MhdTrainingTemplatesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const templates = useMhdTrainingTemplates(companyId, true);
  const [selected, setSelected] = useState<MhdTrainingTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useMhdCreateTrainingTemplate();
  const update = useMhdUpdateTrainingTemplate();
  const remove = useMhdDeleteTrainingTemplate();

  async function deleteTemplate(template: MhdTrainingTemplate) {
    if (!window.confirm(`Delete template “${template.title}”?`)) return;
    setError(null);
    try {
      await remove.mutateAsync(template.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete template.');
    }
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    if (!title) return;
    const description = String(form.get('description') ?? '').trim() || null;
    const rigidity = String(form.get('rigidity') ?? 'COMPOSABLE') as 'LOCKED' | 'COMPOSABLE';
    setError(null);
    try {
      if (selected) {
        await update.mutateAsync({ templateId: selected.id, title, description, rigidity });
        setSelected({ ...selected, title, description, rigidity });
      } else {
        await create.mutateAsync({ companyId, title, description, rigidity });
        setCreating(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save template.');
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader title="Templates" description="Define reusable course structures and authoring guidance." actions={<Button onClick={() => setCreating(true)}>New Template</Button>} />
      {error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead><tr><MhdTh>Title</MhdTh><MhdTh>Rigidity</MhdTh><MhdTh>Active</MhdTh><MhdTh /></tr></thead>
          <tbody>
            {(templates.data ?? []).map((template) => (
              <MhdTr key={template.id}>
                <MhdTd className="font-medium">{template.title}{template.isGlobal ? <span className="ml-2 text-xs text-muted-foreground">Global</span> : null}</MhdTd>
                <MhdTd><MhdBadge variant="neutral">{mhdFormatTrainingTemplateRigidity(template.rigidity)}</MhdBadge></MhdTd>
                <MhdTd><MhdBadge variant={template.isActive ? 'success' : 'neutral'}>{template.isActive ? 'Active' : 'Inactive'}</MhdBadge></MhdTd>
                <MhdTd className="text-right">{template.isGlobal ? <span className="text-sm text-muted-foreground">Read-only</span> : <><button className="mr-3 text-sm text-accent" onClick={() => setSelected(template)}>Edit</button><button className="text-sm text-red-700" onClick={() => void deleteTemplate(template)}>Delete</button></>}</MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      </MhdCard>
      {creating || selected ? <MhdModal title={selected ? `Edit ${selected.title}` : 'New Template'} onClose={() => { setCreating(false); setSelected(null); }} className="relative flex w-full max-w-4xl flex-col rounded-lg border border-border bg-background shadow-xl">
        <form onSubmit={(event) => void saveTemplate(event)} className="space-y-5">
          <h2 className="text-lg font-semibold">{selected ? 'Edit template' : 'New template'}</h2>
          <label className="block text-sm font-medium">Title<input name="title" defaultValue={selected?.title ?? ''} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" required /></label>
          <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={selected?.description ?? ''} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" rows={3} /></label>
          <label className="block text-sm font-medium">Rigidity<select name="rigidity" defaultValue={selected?.rigidity ?? 'COMPOSABLE'} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2"><option value="COMPOSABLE">Composable</option><option value="LOCKED">Locked</option></select></label>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setCreating(false); setSelected(null); }}>Cancel</Button><Button type="submit">Save Template</Button></div>
        </form>
        {selected ? <SlotEditor template={selected} onError={setError} /> : null}
      </MhdModal> : null}
    </div>
  );
}

function SlotEditor({ template, onError }: { template: MhdTrainingTemplate; onError: (value: string) => void }) {
  const slots = useMhdTrainingTemplateSlots(template.id);
  const create = useMhdCreateTrainingTemplateSlot();
  const update = useMhdUpdateTrainingTemplateSlot();
  const remove = useMhdDeleteTrainingTemplateSlot();
  const [editing, setEditing] = useState<MhdTrainingTemplateSlot | null>(null);
  const [slotEditorOpen, setSlotEditorOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [blockType, setBlockType] = useState('');
  const [required, setRequired] = useState(true);
  function begin(slot?: MhdTrainingTemplateSlot) {
    setEditing(slot ?? null); setSlotEditorOpen(true); setLabel(slot?.slotLabel ?? ''); setSortOrder(String(slot?.sortOrder ?? 0)); setBlockType(slot?.expectedBlockType ?? ''); setRequired(slot?.isRequired ?? true);
  }
  async function saveSlot(event: React.FormEvent) {
    event.preventDefault();
    if (template.rigidity === 'LOCKED' && !blockType) {
      onError('Locked templates require an expected block type for every slot.');
      return;
    }
    try {
      if (editing) await update.mutateAsync({ slotId: editing.id, slotLabel: label, sortOrder: Number(sortOrder), expectedBlockType: (blockType || null) as MhdTrainingBlockType | null, clearExpectedBlockType: !blockType, isRequired: required });
      else await create.mutateAsync({ templateId: template.id, slotLabel: label, sortOrder: Number(sortOrder), expectedBlockType: (blockType || null) as MhdTrainingBlockType | null, isRequired: required });
      setEditing(null); setSlotEditorOpen(false); setLabel('');
    } catch (e) { onError(e instanceof Error ? e.message : 'Unable to save slot.'); }
  }
  return <section className="mt-8 border-t border-border pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Slots</h3><Button type="button" variant="secondary" onClick={() => begin()}>Add Slot</Button></div>
    <MhdTable><thead><tr><MhdTh>Label</MhdTh><MhdTh>Expected type</MhdTh><MhdTh>Required</MhdTh><MhdTh>Order</MhdTh><MhdTh /></tr></thead><tbody>{(slots.data ?? []).map((slot) => <MhdTr key={slot.id}><MhdTd>{slot.slotLabel}</MhdTd><MhdTd>{slot.expectedBlockType ? mhdFormatTrainingBlockType(slot.expectedBlockType) : 'No specific type'}</MhdTd><MhdTd>{slot.isRequired ? 'Yes' : 'No'}</MhdTd><MhdTd>{slot.sortOrder}</MhdTd><MhdTd className="text-right"><button className="mr-3 text-sm text-accent" onClick={() => begin(slot)}>Edit</button><button className="text-sm text-red-700" onClick={() => void remove.mutateAsync(slot.id)}>Delete</button></MhdTd></MhdTr>)}</tbody></MhdTable>
    {slotEditorOpen ? <form onSubmit={(event) => void saveSlot(event)} className="mt-4 grid gap-3 rounded-md bg-muted/40 p-3 md:grid-cols-4"><input aria-label="Slot label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Slot label" required className="rounded-md border border-border bg-background px-3 py-2" /><input aria-label="Sort order" type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-md border border-border bg-background px-3 py-2" /><select aria-label="Expected block type" value={blockType} onChange={(event) => setBlockType(event.target.value)} className="rounded-md border border-border bg-background px-3 py-2"><option value="">{template.rigidity === 'COMPOSABLE' ? 'No specific type' : 'Choose a type'}</option>{MHD_TRAINING_TEMPLATE_BLOCK_TYPES.map((type) => <option key={type} value={type}>{mhdFormatTrainingBlockType(type)}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />Required</label><Button type="submit">Save Slot</Button></form> : null}
  </section>;
}

export default MhdTrainingTemplatesPage;
