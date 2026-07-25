import type {
  MhdFormField as MhdFormFieldType,
  MhdFormFileValue,
  MhdFormPage as MhdFormPageType,
} from '../Types';
import { MhdFormField } from './MhdFormField';
import { MhdFormFieldGroup } from './MhdFormFieldGroup';
import { MhdFormTable } from './MhdFormTable';
import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';

interface MhdFormPageProps {
  page: MhdFormPageType;
  fields: MhdFormFieldType[];
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  hiddenFieldIds: Set<string>;
  requiredFieldIds: Set<string>;
  errors: Record<string, string>;
  readOnlyFieldIds?: Set<string>;
  /** Drive upload pipeline for file-type fields; absent in preview/read-only. */
  onUploadFieldFile?: (fieldId: string, file: File) => Promise<MhdFormFileValue>;
}

export function MhdFormPage({
  page,
  fields,
  values,
  onFieldChange,
  hiddenFieldIds,
  requiredFieldIds,
  errors,
  readOnlyFieldIds,
  onUploadFieldFile,
}: MhdFormPageProps) {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const pageFields = page.fields
    .map((fieldId) => fieldsById.get(fieldId))
    .filter((field): field is MhdFormFieldType => Boolean(field));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-foreground">{page.title}</h3>
        {page.description ? <MhdRichTextRenderer html={page.description} className="mt-1" /> : null}
      </div>

      {pageFields.map((field) => {
        if (hiddenFieldIds.has(field.id)) return null;

        if (field.repeatable?.kind === 'section') {
          const rows = Array.isArray(values[field.id])
            ? (values[field.id] as Array<Record<string, unknown>>)
            : [];
          return (
            <MhdFormFieldGroup
              key={field.id}
              field={field}
              rows={rows}
              onChange={(nextRows) => onFieldChange(field.id, nextRows)}
            />
          );
        }

        if (field.repeatable?.kind === 'table') {
          const rows = Array.isArray(values[field.id])
            ? (values[field.id] as Array<Record<string, unknown>>)
            : [];
          return (
            <MhdFormTable
              key={field.id}
              label={field.label}
              columns={(field.repeatable.columns ?? []).map((column) => ({
                id: column.id,
                label: column.label,
                type: column.type,
              }))}
              rows={rows}
              minRows={field.repeatable.minRows}
              maxRows={field.repeatable.maxRows}
              onChange={(nextRows) => onFieldChange(field.id, nextRows)}
            />
          );
        }

        return (
          <MhdFormField
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(nextValue) => onFieldChange(field.id, nextValue)}
            required={requiredFieldIds.has(field.id) || field.required}
            error={errors[field.id] ?? null}
            readOnly={readOnlyFieldIds?.has(field.id)}
            onUploadFile={
              onUploadFieldFile ? (file) => onUploadFieldFile(field.id, file) : undefined
            }
          />
        );
      })}
    </div>
  );
}
