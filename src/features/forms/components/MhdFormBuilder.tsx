import { useMemo, useState } from 'react';
import { Plus, Save, UploadCloud } from 'lucide-react';
import { mhdCreateFormInputSchema } from '../Schemas';
import { mhdFormService } from '../Service';
import type { MhdFieldType, MhdForm, MhdFormDefinition, MhdFormField, MhdFormPage } from '../Types';
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
    options: type === 'select' || type === 'radio' ? [{ value: 'option-1', label: 'Option 1' }] : undefined,
  };
}

export function MhdFormBuilder({ companyId, formId, initialForm, onSaved }: MhdFormBuilderProps) {
  const [formName, setFormName] = useState(initialForm?.name ?? '');
  const [description, setDescription] = useState(initialForm?.description ?? '');
  const [pages, setPages] = useState<MhdFormPage[]>(initialForm?.definition.pages ?? []);
  const [fields, setFields] = useState<MhdFormField[]>(initialForm?.definition.fields ?? []);
  const [logic, setLogic] = useState<MhdFormDefinition['logic']>(initialForm?.definition.logic ?? []);
  const [calculations, setCalculations] = useState<MhdFormDefinition['calculations']>(
    initialForm?.definition.calculations ?? [],
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'logic' | 'calculations' | 'preview'>('fields');
  const [savedFormId, setSavedFormId] = useState<string | undefined>(initialForm?.id ?? formId);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  );

  const buildDefinition = (): MhdFormDefinition => {
    const nextPages =
      pages.length > 0
        ? pages
        : [
            {
              id: 'page-1',
              title: 'Page 1',
              fields: fields.map((field) => field.id),
              order: 1,
            },
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
      description,
      pages: normalizedPages,
      fields,
      logic,
      calculations,
      settings: {
        allowDraft: true,
        multiPage: normalizedPages.length > 1,
        progressBar: true,
      },
    };
  };

  const addField = (type: MhdFieldType) => {
    const field = createBlankField(type);
    setFields((current) => [...current, field]);
    setSelectedFieldId(field.id);
    setPages((current) => {
      if (current.length === 0) {
        return [{ id: 'page-1', title: 'Page 1', fields: [field.id], order: 1 }];
      }
      const [firstPage, ...remainingPages] = current;
      return [{ ...firstPage, fields: [...firstPage.fields, field.id] }, ...remainingPages];
    });
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">Form Name</label>
              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Enter form name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Form description"
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </button>

            {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
            {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex gap-4 border-b border-slate-200">
          {(['fields', 'logic', 'calculations', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-2 text-sm font-semibold capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
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
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Canvas</h3>
                <p className="text-sm text-slate-600">Fields are ordered top-to-bottom on the first page.</p>
              </div>
              <button
                type="button"
                onClick={() => addField('text')}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-3 text-left ${
                    selectedFieldId === field.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{field.label || 'Untitled field'}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{field.type}</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    {field.required ? 'Required' : 'Optional'}
                  </div>
                </button>
              ))}
              {fields.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Add a field from the palette to start building the form.
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
          <MhdFormCalculationEditor fields={fields} calculations={calculations} onChange={setCalculations} />
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
    </div>
  );
}
