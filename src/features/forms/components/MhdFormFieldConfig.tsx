import type { MhdFormField } from '../Types';

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
  const isOptionField =
    field.type === 'select' || field.type === 'dropdown' || field.type === 'radio';

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

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </label>
        <textarea
          value={field.description ?? ''}
          onChange={(event) => onChange({ ...field, description: event.target.value })}
          className="min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

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
    </div>
  );
}
