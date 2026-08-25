import type {
  MhdFormField as MhdFormFieldType,
  MhdFormFieldWidth,
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
    .filter((field): field is MhdFormFieldType => Boolean(field))
    .filter((field) => !hiddenFieldIds.has(field.id));

  const renderField = (field: MhdFormFieldType) => {
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
        onUploadFile={onUploadFieldFile ? (file) => onUploadFieldFile(field.id, file) : undefined}
      />
    );
  };

  const widthClass: Record<MhdFormFieldWidth, string> = {
    full: 'flex-[1_1_100%]',
    half: 'flex-[1_1_calc(50%-0.5rem)]',
    third: 'flex-[1_1_calc(33.333%-0.667rem)]',
    quarter: 'flex-[1_1_calc(25%-0.75rem)]',
  };

  // Group consecutive fields that share a non-empty `group` key into a
  // single flex row so the renderer can place them side by side (e.g. a
  // government-form line like first/middle/last name). Fields with no group
  // key, or whose group key has no sibling in this run, fall through to the
  // ordinary one-per-line rendering.
  const rowGroups: MhdFormFieldType[][] = [];
  for (const field of pageFields) {
    const groupKey = field.group;
    const lastGroup = rowGroups[rowGroups.length - 1];
    const lastGroupKey = lastGroup?.[0]?.group;
    if (groupKey && lastGroup && lastGroupKey === groupKey) {
      lastGroup.push(field);
    } else {
      rowGroups.push([field]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-foreground">{page.title}</h3>
        {page.description ? <MhdRichTextRenderer html={page.description} className="mt-1" /> : null}
      </div>

      {rowGroups.map((group) => {
        if (group.length === 1) return renderField(group[0]);
        return (
          <div key={`group:${group[0].group}`} className="flex flex-wrap gap-4">
            {group.map((field) => (
              <div key={field.id} className={widthClass[field.width ?? 'half']}>
                {renderField(field)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
