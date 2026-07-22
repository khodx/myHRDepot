import type { MhdFormField } from '../Types';
import { MhdFormField as MhdFormFieldControl } from './MhdFormField';

interface MhdFormFieldGroupProps {
  field: MhdFormField;
  rows: Array<Record<string, unknown>>;
  onChange: (rows: Array<Record<string, unknown>>) => void;
  errors?: Record<string, string>;
}

export function MhdFormFieldGroup({ field, rows, onChange, errors }: MhdFormFieldGroupProps) {
  const templateFields = field.repeatable?.fields ?? [];
  const nextRows = rows.length > 0 ? rows : [{}];

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">{field.label}</h4>
        <button
          type="button"
          onClick={() => onChange([...nextRows, {}])}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          Add Row
        </button>
      </div>

      {nextRows.map((row, rowIndex) => (
        <div key={`${field.id}-${rowIndex}`} className="space-y-3 rounded-md border border-slate-200 bg-card p-3">
          {templateFields.map((childField) => (
            <MhdFormFieldControl
              key={childField.id}
              field={childField}
              value={row[childField.id]}
              onChange={(value) => {
                const updatedRows = [...nextRows];
                updatedRows[rowIndex] = { ...updatedRows[rowIndex], [childField.id]: value };
                onChange(updatedRows);
              }}
              error={errors?.[`${rowIndex}.${childField.id}`] ?? null}
            />
          ))}

          {nextRows.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(nextRows.filter((_, index) => index !== rowIndex))}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Remove Row
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
