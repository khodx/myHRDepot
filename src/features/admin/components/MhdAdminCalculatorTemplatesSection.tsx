import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import {
  useMhdCalculatorTemplates,
  useMhdCreateCalculatorTemplate,
  useMhdSetCalculatorTemplateActive,
  useMhdUpdateCalculatorTemplate,
} from '@/features/calculator/Hook';
import {
  mhdCalculatorTemplateFormSchema,
  mhdEvaluateFormula,
  mhdParseFormula,
  type MhdCalculatorTemplateFormValues,
} from '@/features/calculator/Schemas';
import {
  MHD_CALCULATOR_CATEGORIES,
  type MhdCalculatorFieldType,
  type MhdCalculatorInputField,
  type MhdCalculatorTemplate,
} from '@/features/calculator/Types';

const FIELD_TYPES: MhdCalculatorFieldType[] = ['number', 'currency', 'percent', 'integer', 'select'];

function blankField(): MhdCalculatorInputField {
  return { key: '', label: '', type: 'number', required: true };
}

function blankDraft(): MhdCalculatorTemplateFormValues {
  return {
    templateKey: '', category: MHD_CALCULATOR_CATEGORIES[0], title: '', description: '', icon: '',
    inputFields: [blankField()], formula: '', resultLabel: '', resultUnit: '', resultDecimals: 2,
  };
}

function draftFromTemplate(template: MhdCalculatorTemplate): MhdCalculatorTemplateFormValues {
  return {
    templateKey: template.templateKey,
    category: template.category as MhdCalculatorTemplateFormValues['category'],
    title: template.title, description: template.description, icon: template.icon,
    inputFields: template.inputFields, formula: template.formula, resultLabel: template.resultLabel,
    resultUnit: template.resultUnit ?? '', resultDecimals: template.resultDecimals,
  };
}

export function MhdAdminCalculatorTemplatesSection() {
  const templates = useMhdCalculatorTemplates({ includeInactive: true });
  const createTemplate = useMhdCreateCalculatorTemplate();
  const updateTemplate = useMhdUpdateCalculatorTemplate();
  const setActive = useMhdSetCalculatorTemplateActive();
  const [editing, setEditing] = useState<MhdCalculatorTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<MhdCalculatorTemplateFormValues>(blankDraft);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);

  const formulaParse = useMemo(() => mhdParseFormula(draft.formula), [draft.formula]);

  function openCreate() {
    setEditing(null); setEditorOpen(true); setDraft(blankDraft()); setFormErrors({}); setTestResult(null);
  }

  function openEdit(template: MhdCalculatorTemplate) {
    setEditing(template); setEditorOpen(true); setDraft(draftFromTemplate(template)); setFormErrors({}); setTestResult(null);
  }

  function updateDraft<K extends keyof MhdCalculatorTemplateFormValues>(key: K, value: MhdCalculatorTemplateFormValues[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [String(key)]: '' }));
  }

  function updateField(index: number, patch: Partial<MhdCalculatorInputField>) {
    setDraft((current) => ({ ...current, inputFields: current.inputFields.map((field, i) => i === index ? { ...field, ...patch } : field) }));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.inputFields.length) return;
    const fields = [...draft.inputFields];
    [fields[index], fields[target]] = [fields[target], fields[index]];
    updateDraft('inputFields', fields);
  }

  function runTest() {
    try {
      const values: Record<string, number> = {};
      for (const field of draft.inputFields) {
        const raw = testValues[field.key];
        if (raw !== undefined && raw.trim() !== '') values[field.key] = Number(raw);
      }
      setTestResult(String(mhdEvaluateFormula(draft.formula, values)));
    } catch (error: unknown) {
      setTestResult(error instanceof Error ? error.message : 'Formula evaluation failed.');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = mhdCalculatorTemplateFormSchema.safeParse(draft);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      setFormErrors(errors);
      return;
    }
    // A blank "Result unit" field means "no unit" -- store it as a real
    // null, matching the seeded catalog rows, rather than an empty string.
    const payload = { ...result.data, resultUnit: result.data.resultUnit?.trim() || null };
    if (editing) {
      await updateTemplate.mutateAsync({ templateId: editing.id, ...payload });
    } else {
      await createTemplate.mutateAsync(payload);
    }
    setEditing(null); setEditorOpen(false); setDraft(blankDraft()); setFormErrors({}); setTestResult(null);
  }

  const isSaving = createTemplate.isPending || updateTemplate.isPending;
  const sortedTemplates = [...(templates.data ?? [])].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-base font-semibold text-foreground">Calculator Templates</h2><p className="text-sm text-muted-foreground">Manage the platform calculator registry.</p></div>
        <Button className="gap-1.5" onClick={openCreate}><Plus className="h-4 w-4" aria-hidden />Add Template</Button>
      </div>

      {templates.isLoading ? <p className="text-sm text-muted-foreground">Loading templates…</p> : sortedTemplates.length === 0 ? <p className="text-sm text-muted-foreground">No calculator templates yet.</p> : (
        <MhdCard className="overflow-hidden p-0"><MhdTable><thead><tr><MhdTh>Title</MhdTh><MhdTh>Category</MhdTh><MhdTh>Result</MhdTh><MhdTh>Version</MhdTh><MhdTh>Status</MhdTh><MhdTh /></tr></thead><tbody>
          {sortedTemplates.map((template) => <MhdTr key={template.id} className={cn(!template.isActive && 'opacity-60')}>
            <MhdTd><button type="button" className="font-medium text-accent hover:text-accent-hover" onClick={() => openEdit(template)}>{template.title}</button><div className="font-mono text-xs text-muted-foreground">{template.templateKey}</div></MhdTd>
            <MhdTd>{template.category}</MhdTd><MhdTd>{template.resultLabel}{template.resultUnit ? ` (${template.resultUnit})` : ''}</MhdTd><MhdTd>{template.version}</MhdTd><MhdTd>{template.isActive ? 'Active' : 'Retired'}</MhdTd>
            <MhdTd className="text-right"><button type="button" disabled={setActive.isPending} onClick={() => void setActive.mutateAsync({ templateId: template.id, isActive: !template.isActive })} className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50">{template.isActive ? 'Retire' : 'Reactivate'}</button></MhdTd>
          </MhdTr>)}
        </tbody></MhdTable></MhdCard>
      )}

      {editorOpen ? <MhdCard className="p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">{editing ? 'Edit Template' : 'New Template'}</h2><button type="button" onClick={() => { setEditing(null); setEditorOpen(false); }} aria-label="Close editor"><X className="h-4 w-4" /></button></div>
        <form className="space-y-5" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">Template key<input className="mhd-input" disabled={Boolean(editing)} value={draft.templateKey} onChange={(e) => updateDraft('templateKey', e.target.value)} />{formErrors.templateKey && <span className="text-xs text-destructive">{formErrors.templateKey}</span>}</label>
            <label className="space-y-1 text-sm">Category<select className="mhd-input" value={draft.category} onChange={(e) => updateDraft('category', e.target.value as MhdCalculatorTemplateFormValues['category'])}>{MHD_CALCULATOR_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>{formErrors.category && <span className="text-xs text-destructive">{formErrors.category}</span>}</label>
            <label className="space-y-1 text-sm">Title<input className="mhd-input" value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} />{formErrors.title && <span className="text-xs text-destructive">{formErrors.title}</span>}</label>
            <label className="space-y-1 text-sm">Icon (lucide-react name)<input className="mhd-input" value={draft.icon} onChange={(e) => updateDraft('icon', e.target.value)} />{formErrors.icon && <span className="text-xs text-destructive">{formErrors.icon}</span>}</label>
          </div>
          <label className="block space-y-1 text-sm">Description<textarea className="mhd-input min-h-20" value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} />{formErrors.description && <span className="text-xs text-destructive">{formErrors.description}</span>}</label>
          <div className="grid gap-4 md:grid-cols-3"><label className="space-y-1 text-sm">Result label<input className="mhd-input" value={draft.resultLabel} onChange={(e) => updateDraft('resultLabel', e.target.value)} />{formErrors.resultLabel && <span className="text-xs text-destructive">{formErrors.resultLabel}</span>}</label><label className="space-y-1 text-sm">Result unit<input className="mhd-input" value={draft.resultUnit ?? ''} onChange={(e) => updateDraft('resultUnit', e.target.value)} /></label><label className="space-y-1 text-sm">Result decimals<input className="mhd-input" type="number" min="0" max="6" value={draft.resultDecimals} onChange={(e) => updateDraft('resultDecimals', Number(e.target.value))} />{formErrors.resultDecimals && <span className="text-xs text-destructive">{formErrors.resultDecimals}</span>}</label></div>

          <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-medium text-foreground">Input fields</h3><Button type="button" variant="secondary" onClick={() => updateDraft('inputFields', [...draft.inputFields, blankField()])}>Add field</Button></div>
            {draft.inputFields.map((field, index) => <div key={`${index}-${field.key}`} className="space-y-3 rounded-lg border border-border p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Field {index + 1}</span><div className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => moveField(index, -1)} className="text-xs text-accent disabled:opacity-40">Up</button><button type="button" disabled={index === draft.inputFields.length - 1} onClick={() => moveField(index, 1)} className="text-xs text-accent disabled:opacity-40">Down</button><button type="button" onClick={() => updateDraft('inputFields', draft.inputFields.filter((_, i) => i !== index))} className="text-xs text-destructive">Remove</button></div></div>
              <div className="grid gap-3 md:grid-cols-3"><label className="space-y-1 text-xs">Key<input className="mhd-input" value={field.key} onChange={(e) => updateField(index, { key: e.target.value })} /></label><label className="space-y-1 text-xs">Label<input className="mhd-input" value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} /></label><label className="space-y-1 text-xs">Type<select className="mhd-input" value={field.type} onChange={(e) => updateField(index, { type: e.target.value as MhdCalculatorFieldType })}>{FIELD_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label></div>
              <div className="grid gap-3 md:grid-cols-5"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={field.required} onChange={(e) => updateField(index, { required: e.target.checked })} />Required</label>{(['min', 'max', 'step'] as const).map((key) => <label key={key} className="space-y-1 text-xs">{key}<input className="mhd-input" type="number" value={field[key] ?? ''} onChange={(e) => updateField(index, { [key]: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>)}<label className="space-y-1 text-xs">Unit<input className="mhd-input" value={field.unit ?? ''} onChange={(e) => updateField(index, { unit: e.target.value })} /></label><label className="space-y-1 text-xs">Default<input className="mhd-input" value={field.defaultValue ?? ''} onChange={(e) => updateField(index, { defaultValue: e.target.value })} /></label></div>
              <label className="block space-y-1 text-xs">Help text<input className="mhd-input" value={field.helpText ?? ''} onChange={(e) => updateField(index, { helpText: e.target.value })} /></label>
              {field.type === 'select' ? <div className="space-y-2 rounded border border-border p-3"><div className="flex items-center justify-between text-xs font-medium">Options<button type="button" onClick={() => updateField(index, { options: [...(field.options ?? []), { value: '', label: '' }] })} className="text-accent">Add option</button></div>{(field.options ?? []).map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><input aria-label="Option value" className="mhd-input" placeholder="Value" value={option.value} onChange={(e) => updateField(index, { options: field.options?.map((item, i) => i === optionIndex ? { ...item, value: e.target.value } : item) })} /><input aria-label="Option label" className="mhd-input" placeholder="Label" value={option.label} onChange={(e) => updateField(index, { options: field.options?.map((item, i) => i === optionIndex ? { ...item, label: e.target.value } : item) })} /><button type="button" onClick={() => updateField(index, { options: field.options?.filter((_, i) => i !== optionIndex) })} className="text-xs text-destructive">Remove</button></div>)}</div> : null}
            </div>)}
            {formErrors.inputFields && <span className="text-xs text-destructive">{formErrors.inputFields}</span>}
          </section>

          <section className="space-y-3"><label className="block space-y-1 text-sm">Formula<input className={cn('mhd-input', (!formulaParse.ok || formErrors.formula) && 'border-destructive')} value={draft.formula} onChange={(e) => updateDraft('formula', e.target.value)} /></label>{!formulaParse.ok ? <p className="text-xs text-destructive">{formulaParse.error}</p> : null}{formErrors.formula && formErrors.formula !== formulaParse.error ? <p className="text-xs text-destructive">{formErrors.formula}</p> : null}
            <div className="rounded-lg border border-border bg-muted/20 p-4"><h3 className="mb-3 font-medium text-foreground">Test this formula</h3><div className="grid gap-3 md:grid-cols-3">{draft.inputFields.map((field) => <label key={field.key || field.label} className="space-y-1 text-xs">{field.label || field.key || 'Unnamed field'}<input className="mhd-input" type="number" value={testValues[field.key] ?? (field.defaultValue === undefined ? '' : String(field.defaultValue))} onChange={(e) => setTestValues((current) => ({ ...current, [field.key]: e.target.value }))} /></label>)}</div><div className="mt-3 flex items-center gap-3"><Button type="button" variant="secondary" onClick={runTest}>Run</Button>{testResult !== null ? <span className="text-sm text-muted-foreground">Result: {testResult}</span> : null}</div></div>
          </section>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => { setEditing(null); setEditorOpen(false); }}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create template'}</Button></div>
        </form>
      </MhdCard> : null}
    </div>
  );
}
