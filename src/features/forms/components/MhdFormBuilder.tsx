import { useMemo, useState } from 'react';
import { Plus, Save, UploadCloud } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { mhdCreateFormInputSchema } from '../Schemas';
import { mhdFormService } from '../Service';
import type { MhdFieldType, MhdForm, MhdFormDefinition, MhdFormField, MhdFormPage } from '../Types';
import { MhdFormBuilderPageTabs } from './MhdFormBuilderPageTabs';
import { MhdFormCalculationEditor } from './MhdFormCalculationEditor';
import { MhdFormFieldPalette } from './MhdFormFieldPalette';
import { MhdFormLogicEditor } from './MhdFormLogicEditor';
import { MhdFormPreview } from './MhdFormPreview';
import { MhdFormPropertyPanel } from './MhdFormPropertyPanel';

interface MhdFormBuilderProps {
  companyId: string;
  formId?: string;
  initialForm?: MhdForm | null;
  onSaved?: (form: MhdForm) => void;
}

function createBlankField(type: MhdFieldType): MhdFormField {
  return {
    id: `field-${Date.now()}-${Math.round(Math.random() * 9999)}`,
    type,
    label: '',
    required: false,
    hidden: false,
    options:
      type === 'select' || type === 'radio'
        ? [{ value: 'option-1', label: 'Option 1' }]
        : undefined,
  };
}

function createBlankPage(order: number, existingFieldIds: string[] = []): MhdFormPage {
  return {
    id: order === 1 ? 'page-1' : `page-${Date.now()}-${Math.round(Math.random() * 9999)}`,
    title: `Page ${order}`,
    fields: existingFieldIds,
    order,
  };
}

function sortPages(pages: MhdFormPage[]): MhdFormPage[] {
  return [...pages].sort((left, right) => left.order - right.order);
}

export function MhdFormBuilder({ companyId, formId, initialForm, onSaved }: MhdFormBuilderProps) {
  const [formName, setFormName] = useState(initialForm?.name ?? '');
  const [description, setDescription] = useState(initialForm?.description ?? '');
  const [pages, setPages] = useState<MhdFormPage[]>(initialForm?.definition.pages ?? []);
  const [fields, setFields] = useState<MhdFormField[]>(initialForm?.definition.fields ?? []);
  const [logic, setLogic] = useState<MhdFormDefinition['logic']>(
    initialForm?.definition.logic ?? [],
  );
  const [calculations, setCalculations] = useState<MhdFormDefinition['calculations']>(
    initialForm?.definition.calculations ?? [],
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(
    sortPages(initialForm?.definition.pages ?? [])[0]?.id ?? null,
  );
  const [activeTab, setActiveTab] = useState<'fields' | 'logic' | 'calculations' | 'preview'>(
    'fields',
  );
  const [savedFormId, setSavedFormId] = useState<string | undefined>(initialForm?.id ?? formId);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  );

  const sortedPages = useMemo(() => sortPages(pages), [pages]);
  const activePage = useMemo(
    () => sortedPages.find((page) => page.id === activePageId) ?? sortedPages[0] ?? null,
    [activePageId, sortedPages],
  );

  const fieldsById = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  // Canvas lists the active page's fields in page order; before any page
  // exists (a brand-new form) it falls back to the flat field list.
  const canvasFields = useMemo(() => {
    if (!activePage) return fields;
    return activePage.fields
      .map((fieldId) => fieldsById.get(fieldId))
      .filter((field): field is MhdFormField => Boolean(field));
  }, [activePage, fields, fieldsById]);

  const buildDefinition = (): MhdFormDefinition => {
    const nextPages =
      pages.length > 0
        ? sortPages(pages)
        : [
            createBlankPage(
              1,
              fields.map((field) => field.id),
            ),
          ];

    const normalizedPages = nextPages.map((page, pageIndex) => ({
      ...page,
      fields: page.fields.filter((fieldId) => fields.some((field) => field.id === fieldId)),
      order: page.order ?? pageIndex + 1,
    }));

    if (normalizedPages.length === 1 && normalizedPages[0].fields.length === 0) {
      normalizedPages[0] = {
        ...normalizedPages[0],
        fields: fields.map((field) => field.id),
      };
    }

    return {
      id: savedFormId ?? `form-${Date.now()}`,
      name: formName,
      description: description || undefined,
      pages: normalizedPages,
      fields,
      logic,
      calculations,
      // Preserve the loaded settings so an untouched definition round-trips
      // through load -> save unchanged; only multiPage is derived from the
      // authored page count.
      settings: {
        allowDraft: initialForm?.definition.settings.allowDraft ?? true,
        multiPage:
          normalizedPages.length > 1 || (initialForm?.definition.settings.multiPage ?? false),
        progressBar: initialForm?.definition.settings.progressBar ?? true,
      },
    };
  };

  const addField = (type: MhdFieldType) => {
    const field = createBlankField(type);
    setFields((current) => [...current, field]);
    setSelectedFieldId(field.id);
    if (pages.length === 0) {
      // A brand-new form: materialize the implicit first page holding every
      // field authored so far plus the new one.
      const page = createBlankPage(1, [...fields.map((existing) => existing.id), field.id]);
      setPages([page]);
      setActivePageId(page.id);
      return;
    }
    const targetPageId = activePage?.id ?? sortedPages[0].id;
    setPages((current) =>
      current.map((page) =>
        page.id === targetPageId ? { ...page, fields: [...page.fields, field.id] } : page,
      ),
    );
  };

  const addPage = () => {
    // A brand-new form has no explicit page yet: materialize the implicit
    // first page (holding all current fields) before appending the new one.
    const base =
      pages.length > 0
        ? sortPages(pages)
        : [
            createBlankPage(
              1,
              fields.map((field) => field.id),
            ),
          ];
    const nextPage = createBlankPage(base.length + 1);
    setPages([...base, nextPage]);
    setActivePageId(nextPage.id);
  };

  const renamePage = (pageId: string, title: string) => {
    setPages((current) => current.map((page) => (page.id === pageId ? { ...page, title } : page)));
  };

  const movePage = (pageId: string, direction: -1 | 1) => {
    setPages((current) => {
      const ordered = sortPages(current);
      const index = ordered.findIndex((page) => page.id === pageId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return current;
      [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];
      return ordered.map((page, pageIndex) => ({ ...page, order: pageIndex + 1 }));
    });
  };

  const removePage = (pageId: string) => {
    if (pages.length <= 1) return;
    const ordered = sortPages(pages);
    const removed = ordered.find((page) => page.id === pageId);
    if (!removed) return;
    const remaining = ordered.filter((page) => page.id !== pageId);
    // Orphaned fields are reassigned to the first remaining page so no field
    // silently drops out of the definition.
    remaining[0] = { ...remaining[0], fields: [...remaining[0].fields, ...removed.fields] };
    setPages(remaining.map((page, pageIndex) => ({ ...page, order: pageIndex + 1 })));
    setActivePageId(remaining[0].id);
  };

  const assignFieldToPage = (fieldId: string, pageId: string) => {
    setPages((current) =>
      current.map((page) => {
        const withoutField = page.fields.filter((currentFieldId) => currentFieldId !== fieldId);
        if (page.id === pageId) {
          return { ...page, fields: [...withoutField, fieldId] };
        }
        return withoutField.length === page.fields.length
          ? page
          : { ...page, fields: withoutField };
      }),
    );
  };

  const handleFieldChange = (nextField: MhdFormField) => {
    setFields((current) => current.map((field) => (field.id === nextField.id ? nextField : field)));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields((current) => current.filter((field) => field.id !== fieldId));
    setPages((current) =>
      current.map((page) => ({
        ...page,
        fields: page.fields.filter((currentFieldId) => currentFieldId !== fieldId),
      })),
    );
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleSave = async (): Promise<MhdForm | null> => {
    setIsSaving(true);
    setSaveError(null);
    setStatusMessage(null);

    try {
      const definition = buildDefinition();
      const parsed = mhdCreateFormInputSchema.safeParse({
        name: formName,
        description,
        definition,
      });

      if (!parsed.success) {
        setSaveError(parsed.error.issues[0]?.message ?? 'Form is invalid');
        return null;
      }

      const savedForm = savedFormId
        ? await mhdFormService.updateForm(savedFormId, {
            name: formName,
            description,
            definition,
          })
        : await mhdFormService.createForm(
            {
              name: formName,
              description,
              definition,
            },
            companyId,
          );

      setSavedFormId(savedForm.id);
      setStatusMessage('Draft saved.');
      onSaved?.(savedForm);
      return savedForm;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save form');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setSaveError(null);
    setStatusMessage(null);

    try {
      let activeFormId = savedFormId;
      if (!activeFormId) {
        const savedForm = await handleSave();
        activeFormId = savedForm?.id;
      }

      if (!activeFormId) return;

      const publishedForm = await mhdFormService.publishForm(activeFormId);
      setStatusMessage('Form published.');
      onSaved?.(publishedForm);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to publish form');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <MhdCard className="overflow-hidden p-0">
      <div className="border-b border-border p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Form Name</label>
              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Enter form name"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Form description"
                className="min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </button>

            {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
            {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex gap-4 border-b border-border">
          {(['fields', 'logic', 'calculations', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-2 text-sm font-semibold capitalize ${
                activeTab === tab
                  ? 'border-accent text-accent-hover'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'fields' ? (
        <div className="flex min-h-[32rem]">
          <MhdFormFieldPalette onAddField={addField} />

          <div className="flex-1 p-4">
            <MhdFormBuilderPageTabs
              pages={sortedPages}
              activePageId={activePage?.id ?? null}
              onSelectPage={setActivePageId}
              onAddPage={addPage}
              onRenamePage={renamePage}
              onMovePage={movePage}
              onRemovePage={removePage}
            />

            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Canvas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fields are ordered top-to-bottom on{' '}
                  {activePage ? `"${activePage.title}"` : 'the first page'}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addField('text')}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>

            <div className="space-y-2">
              {canvasFields.map((field) => (
                <div
                  key={field.id}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 ${
                    selectedFieldId === field.id
                      ? 'border-accent bg-accent-tint'
                      : 'border-border bg-card hover:border-accent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFieldId(field.id)}
                    className="flex flex-1 items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {field.label || 'Untitled field'}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {field.type}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {field.required ? 'Required' : 'Optional'}
                    </div>
                  </button>
                  {sortedPages.length > 1 ? (
                    <select
                      aria-label={`Page for ${field.label || 'Untitled field'}`}
                      value={activePage?.id ?? sortedPages[0].id}
                      onChange={(event) => assignFieldToPage(field.id, event.target.value)}
                      className="rounded-md border border-border px-2 py-1 text-xs"
                    >
                      {sortedPages.map((page, pageIndex) => (
                        <option key={page.id} value={page.id}>
                          {page.title || `Page ${pageIndex + 1}`}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
              {canvasFields.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                  Add a field from the palette to start building{' '}
                  {activePage ? `"${activePage.title}"` : 'the form'}.
                </p>
              ) : null}
            </div>
          </div>

          <MhdFormPropertyPanel
            selectedField={selectedField}
            onChange={handleFieldChange}
            onDeleteField={handleDeleteField}
          />
        </div>
      ) : null}

      {activeTab === 'logic' ? (
        <div className="p-4">
          <MhdFormLogicEditor fields={fields} rules={logic} onChange={setLogic} />
        </div>
      ) : null}

      {activeTab === 'calculations' ? (
        <div className="p-4">
          <MhdFormCalculationEditor
            fields={fields}
            calculations={calculations}
            onChange={setCalculations}
          />
        </div>
      ) : null}

      {activeTab === 'preview' ? (
        <div className="p-4">
          <MhdFormPreview
            form={{
              id: savedFormId ?? 'preview',
              name: formName || 'Untitled Form',
              description,
              definition: buildDefinition(),
            }}
          />
        </div>
      ) : null}
    </MhdCard>
  );
}
