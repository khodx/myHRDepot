import type { MhdFormField } from '../Types';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdPlainTextToRichHtml } from '@/components/ui/MhdRichTextUtils';

interface MhdFormFieldConfigProps {
  field: MhdFormField;
  onChange: (field: MhdFormField) => void;
}

function updateOptionLabel(field: MhdFormField, index: number, nextLabel: string): MhdFormField {
  const options = [...(field.options ?? [])];
  const current = options[index];
  if (!current) return field;

  options[index] = {
    value: current.value,
    label: nextLabel,
  };

  return {
    ...field,
    options,
  };
}

export function MhdFormFieldConfig({ field, onChange }: MhdFormFieldConfigProps) {
  const isOptionField = [
    'choice',
    'select',
    'dropdown',
    'radio',
    'state_select',
    'lookup',
    'person',
  ].includes(field.type);
  const isRepeatingSection =
    field.type === 'repeating_section' || field.repeatable?.kind === 'section';
  const isRepeatingTable =
    field.type === 'repeating_table' ||
    field.type === 'table' ||
    field.type === 'grid' ||
    field.repeatable?.kind === 'table';

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Label
        </label>
        <input
          type="text"
          value={field.label}
          onChange={(event) => onChange({ ...field, label: event.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <MhdRichTextEditor
        label="Description"
        html={
          field.description?.includes('<')
            ? field.description
            : mhdPlainTextToRichHtml(field.description)
        }
        onChange={(html, plainText) => onChange({ ...field, description: html || plainText })}
        minHeightClassName="min-h-20"
      />

      <MhdRichTextEditor
        label="Help Text"
        html={
          field.helpText?.includes('<') ? field.helpText : mhdPlainTextToRichHtml(field.helpText)
        }
        onChange={(html, plainText) => onChange({ ...field, helpText: html || plainText })}
        minHeightClassName="min-h-20"
      />

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Placeholder
        </label>
        <input
          type="text"
          value={field.placeholder ?? ''}
          onChange={(event) => onChange({ ...field, placeholder: event.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(event) => onChange({ ...field, required: event.target.checked })}
          />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={field.hidden}
            onChange={(event) => onChange({ ...field, hidden: event.target.checked })}
          />
          Hidden by default
        </label>
      </div>

      {isOptionField ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Options
            </label>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...field,
                  options: [
                    ...(field.options ?? []),
                    { value: `option-${Date.now()}`, label: 'New option' },
                  ],
                })
              }
              className="text-xs font-semibold text-accent hover:text-accent-hover"
            >
              Add option
            </button>
          </div>
          {(field.options ?? []).map((option, index) => (
            <div key={option.value} className="flex items-center gap-2">
              <input
                type="text"
                value={option.label}
                onChange={(event) => onChange(updateOptionLabel(field, index, event.target.value))}
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...field,
                    options: (field.options ?? []).filter(
                      (_, optionIndex) => optionIndex !== index,
                    ),
                  })
                }
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {isRepeatingSection ? (
        <div className="space-y-2 border-t border-border pt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Repeating Section
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              value={field.repeatable?.minRows ?? 1}
              onChange={(event) =>
                onChange({
                  ...field,
                  repeatable: {
                    kind: 'section',
                    ...(field.repeatable ?? {}),
                    minRows: Number(event.target.value),
                  },
                })
              }
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              aria-label="Minimum Rows"
            />
            <input
              type="number"
              value={field.repeatable?.maxRows ?? 10}
              onChange={(event) =>
                onChange({
                  ...field,
                  repeatable: {
                    kind: 'section',
                    ...(field.repeatable ?? {}),
                    maxRows: Number(event.target.value),
                  },
                })
              }
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              aria-label="Maximum Rows"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...field,
                repeatable: {
                  kind: 'section',
                  ...(field.repeatable ?? {}),
                  fields: [
                    ...(field.repeatable?.fields ?? []),
                    {
                      id: `child-${Date.now()}`,
                      type: 'text',
                      label: 'New Field',
                      required: false,
                      hidden: false,
                    },
                  ],
                },
              })
            }
            className="text-xs font-semibold text-accent hover:text-accent-hover"
          >
            Add nested field
          </button>
          {(field.repeatable?.fields ?? []).map((childField, index) => (
            <input
              key={childField.id}
              type="text"
              value={childField.label}
              onChange={(event) => {
                const fields = [...(field.repeatable?.fields ?? [])];
                fields[index] = { ...childField, label: event.target.value };
                onChange({
                  ...field,
                  repeatable: { kind: 'section', ...(field.repeatable ?? {}), fields },
                });
              }}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          ))}
        </div>
      ) : null}

      {isRepeatingTable ? (
        <div className="space-y-2 border-t border-border pt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Repeating Table
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              value={field.repeatable?.minRows ?? 1}
              onChange={(event) =>
                onChange({
                  ...field,
                  repeatable: {
                    kind: 'table',
                    ...(field.repeatable ?? {}),
                    minRows: Number(event.target.value),
                  },
                })
              }
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              aria-label="Minimum Rows"
            />
            <input
              type="number"
              value={field.repeatable?.maxRows ?? 25}
              onChange={(event) =>
                onChange({
                  ...field,
                  repeatable: {
                    kind: 'table',
                    ...(field.repeatable ?? {}),
                    maxRows: Number(event.target.value),
                  },
                })
              }
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              aria-label="Maximum Rows"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...field,
                repeatable: {
                  kind: 'table',
                  ...(field.repeatable ?? {}),
                  columns: [
                    ...(field.repeatable?.columns ?? []),
                    {
                      id: `column_${Date.now()}`,
                      label: 'New Column',
                      type: 'text',
                    },
                  ],
                },
              })
            }
            className="text-xs font-semibold text-accent hover:text-accent-hover"
          >
            Add column
          </button>
          {(field.repeatable?.columns ?? []).map((column, index) => (
            <input
              key={column.id}
              type="text"
              value={column.label}
              onChange={(event) => {
                const columns = [...(field.repeatable?.columns ?? [])];
                columns[index] = { ...column, label: event.target.value };
                onChange({
                  ...field,
                  repeatable: { kind: 'table', ...(field.repeatable ?? {}), columns },
                });
              }}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
