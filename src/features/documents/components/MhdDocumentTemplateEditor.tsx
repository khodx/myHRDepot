import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import type { MhdCompany } from '@/features/companies/Types';
import {
  MHD_DOCUMENT_CONTENT_FORMATS,
  MHD_DOCUMENT_TEMPLATE_ENTITY_TYPES,
  MHD_DOCUMENT_TEMPLATE_TYPES,
  type MhdDocumentMergeField,
  type MhdDocumentMergeFieldCatalogEntry,
  type MhdDocumentMergeFieldSource,
  type MhdDocumentTemplateDetail,
} from '../Types';
import { mhdDocumentTemplateFormSchema } from '../Schemas';
import { mhdDocumentService } from '../Service';

interface MhdDocumentTemplateEditorProps {
  companies: MhdCompany[];
  canAuthorPlatformLevel: boolean;
  selectedTemplate: MhdDocumentTemplateDetail | null;
  isSaving: boolean;
  onCreate: (values: ReturnType<typeof mhdDocumentTemplateFormSchema.parse>) => Promise<void>;
  onUpdate: (values: ReturnType<typeof mhdDocumentTemplateFormSchema.parse>) => Promise<void>;
  onCancel: () => void;
}

const MERGE_FIELD_SOURCES: MhdDocumentMergeFieldSource[] = [
  'person',
  'company',
  'user',
  'task',
  'system',
  'custom',
];

function emptyMergeField(): MhdDocumentMergeField {
  return { path: '', label: '', source: 'custom' };
}

export function MhdDocumentTemplateEditor({
  companies,
  canAuthorPlatformLevel,
  selectedTemplate,
  isSaving,
  onCreate,
  onUpdate,
  onCancel,
}: MhdDocumentTemplateEditorProps) {
  const [companyId, setCompanyId] = useState<string | null>(companies[0]?.id ?? null);
  const [name, setName] = useState('');
  const [templateType, setTemplateType] = useState<string>(MHD_DOCUMENT_TEMPLATE_TYPES[0]);
  const [applicableEntityType, setApplicableEntityType] = useState<string>('');
  const [contentFormat, setContentFormat] = useState<string>(MHD_DOCUMENT_CONTENT_FORMATS[0]);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [mergeFields, setMergeFields] = useState<MhdDocumentMergeField[]>([]);
  const [mergeFieldCatalog, setMergeFieldCatalog] = useState<
    MhdDocumentMergeFieldCatalogEntry[]
  >([]);
  const [formError, setFormError] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    void mhdDocumentService
      .listMergeFieldCatalog()
      .then(setMergeFieldCatalog)
      .catch(() => setMergeFieldCatalog([]));
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected template prop
      setCompanyId(selectedTemplate.companyId);
      setName(selectedTemplate.name);
      setTemplateType(selectedTemplate.templateType);
      setApplicableEntityType(selectedTemplate.applicableEntityType ?? '');
      setContentFormat(selectedTemplate.contentFormat);
      setContent(selectedTemplate.content);
      setDescription(selectedTemplate.description ?? '');
      setRequiresSignature(selectedTemplate.requiresSignature);
      setIsActive(selectedTemplate.isActive);
      setMergeFields(selectedTemplate.mergeFields);
    } else {
      setCompanyId(companies[0]?.id ?? null);
      setName('');
      setTemplateType(MHD_DOCUMENT_TEMPLATE_TYPES[0]);
      setApplicableEntityType('');
      setContentFormat(MHD_DOCUMENT_CONTENT_FORMATS[0]);
      setContent('');
      setDescription('');
      setRequiresSignature(false);
      setIsActive(true);
      setMergeFields([]);
    }
  }, [companies, selectedTemplate]);

  function updateMergeField(index: number, patch: Partial<MhdDocumentMergeField>) {
    setMergeFields((current) =>
      current.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  }

  function insertCatalogField(entry: MhdDocumentMergeFieldCatalogEntry) {
    const placeholder = `{{${entry.source}.${entry.path}}}`;
    const textarea = contentTextareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? start;
    setContent((current) => `${current.slice(0, start)}${placeholder}${current.slice(end)}`);
    setMergeFields((current) =>
      current.some((field) => field.source === entry.source && field.path === entry.path)
        ? current
        : [
            ...current,
            {
              source: entry.source,
              path: entry.path,
              label: entry.label,
            },
          ],
    );
    requestAnimationFrame(() => {
      const nextCursor = start + placeholder.length;
      contentTextareaRef.current?.focus();
      contentTextareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = mhdDocumentTemplateFormSchema.safeParse({
      companyId,
      name,
      templateType,
      applicableEntityType: applicableEntityType || null,
      contentFormat,
      content,
      mergeFields,
      description,
      requiresSignature,
      isActive,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please correct the template form.');
      return;
    }

    try {
      if (selectedTemplate) {
        await onUpdate(parsed.data);
      } else {
        await onCreate(parsed.data);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save template.');
    }
  }

  return (
    <form
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-semibold text-foreground">
          {selectedTemplate ? 'Edit Template' : 'New Template'}
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      {formError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <MhdFormFieldStack className="mt-4">
        <label className="text-sm font-medium text-foreground">
          Company
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={companyId ?? ''}
            onChange={(event) => setCompanyId(event.target.value === '' ? null : event.target.value)}
          >
            {canAuthorPlatformLevel ? <option value="">Platform-level (shared)</option> : null}
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Name
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Template Type
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={templateType}
            onChange={(event) => setTemplateType(event.target.value)}
          >
            {MHD_DOCUMENT_TEMPLATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Module
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={applicableEntityType}
            onChange={(event) => setApplicableEntityType(event.target.value)}
          >
            <option value="">Unassigned (admin library only)</option>
            {MHD_DOCUMENT_TEMPLATE_ENTITY_TYPES.map((entityType) => (
              <option key={entityType.value} value={entityType.value}>
                {entityType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Content Format
          <select
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={contentFormat}
            onChange={(event) => setContentFormat(event.target.value)}
          >
            {MHD_DOCUMENT_CONTENT_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Description
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Content
          <textarea
            ref={contentTextareaRef}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            rows={8}
            placeholder="Dear {{person.first_name}}, ..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Merge Fields</p>
            <button
              type="button"
              onClick={() => setMergeFields((current) => [...current, emptyMergeField()])}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Add field
            </button>
          </div>
          {mergeFieldCatalog.length > 0 && (
            <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Catalog fields</p>
              {MERGE_FIELD_SOURCES.map((source) => {
                const sourceEntries = mergeFieldCatalog.filter((entry) => entry.source === source);
                if (sourceEntries.length === 0) return null;
                return (
                  <div key={source} className="flex flex-wrap items-center gap-2">
                    <span className="w-16 text-xs font-semibold capitalize text-muted-foreground">
                      {source}
                    </span>
                    {sourceEntries.map((entry) => (
                      <button
                        key={`${entry.source}.${entry.path}`}
                        type="button"
                        title={`Insert {{${entry.source}.${entry.path}}}`}
                        onClick={() => insertCatalogField(entry)}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 space-y-2">
            {mergeFields.map((field, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <input
                  className="min-w-40 flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  placeholder="path (e.g. person.first_name)"
                  value={field.path}
                  onChange={(event) => updateMergeField(index, { path: event.target.value })}
                />
                <input
                  className="min-w-32 flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  placeholder="label"
                  value={field.label}
                  onChange={(event) => updateMergeField(index, { label: event.target.value })}
                />
                <select
                  className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  value={field.source}
                  onChange={(event) =>
                    updateMergeField(index, {
                      source: event.target.value as MhdDocumentMergeFieldSource,
                    })
                  }
                >
                  {MERGE_FIELD_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setMergeFields((current) => current.filter((_, i) => i !== index))
                  }
                  aria-label="Remove merge field"
                  className="rounded p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={requiresSignature}
            onChange={(event) => setRequiresSignature(event.target.checked)}
          />
          Requires Signature
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Active
        </label>
      </MhdFormFieldStack>

      <Button type="submit" disabled={isSaving} className="mt-4">
        {isSaving ? 'Saving...' : selectedTemplate ? 'Update Template' : 'Create Template'}
      </Button>
    </form>
  );
}
