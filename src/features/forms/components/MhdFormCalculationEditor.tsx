import { useState } from 'react';
import type { MhdCalculationOp, MhdFormCalculation, MhdFormField } from '../Types';

interface MhdFormCalculationEditorProps {
  fields: MhdFormField[];
  calculations: MhdFormCalculation[];
  onChange: (calculations: MhdFormCalculation[]) => void;
}

const MHD_CALCULATION_OPS: Array<{ value: MhdCalculationOp; label: string }> = [
  { value: 'sum', label: 'Sum of fields' },
  { value: 'average', label: 'Average of fields' },
  { value: 'count', label: 'Count filled fields' },
  { value: 'concatenate', label: 'Concatenate text fields' },
  { value: 'formula', label: 'Custom formula' },
];

export function MhdFormCalculationEditor({
  fields,
  calculations,
  onChange,
}: MhdFormCalculationEditorProps) {
  const [targetFieldId, setTargetFieldId] = useState(fields[0]?.id ?? '');
  const [op, setOp] = useState<MhdCalculationOp>('sum');
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [formula, setFormula] = useState('');

  const fieldLabel = (fieldId: string) =>
    fields.find((field) => field.id === fieldId)?.label ?? fieldId;

  const toggleDependency = (fieldId: string) => {
    setDependencyIds((current) =>
      current.includes(fieldId)
        ? current.filter((entry) => entry !== fieldId)
        : [...current, fieldId],
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Add Calculation
        </h3>
        <div className="mt-3 grid gap-3">
          <select
            value={targetFieldId}
            onChange={(event) => setTargetFieldId(event.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label || field.id}
              </option>
            ))}
          </select>

          <select
            value={op}
            onChange={(event) => setOp(event.target.value as MhdCalculationOp)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            {MHD_CALCULATION_OPS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>

          {op === 'formula' ? (
            <input
              type="text"
              value={formula}
              onChange={(event) => setFormula(event.target.value)}
              placeholder="salary * 0.15"
              className="rounded-md border border-border px-3 py-2 font-mono text-sm"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {fields
                .filter((field) => field.id !== targetFieldId)
                .map((field) => (
                  <label
                    key={field.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={dependencyIds.includes(field.id)}
                      onChange={() => toggleDependency(field.id)}
                    />
                    {field.label || field.id}
                  </label>
                ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (!targetFieldId) return;
            onChange([
              ...calculations,
              {
                id: `calc-${Date.now()}`,
                targetFieldId,
                op,
                formula: op === 'formula' ? formula : undefined,
                dependencies: dependencyIds,
              },
            ]);
            setDependencyIds([]);
            setFormula('');
          }}
          className="mt-3 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover"
        >
          Add Calculation
        </button>
      </div>

      <div className="space-y-2">
        {calculations.map((calculation) => (
          <div
            key={calculation.id}
            className="flex items-start justify-between gap-4 rounded-md border border-border bg-card p-3 text-sm"
          >
            <div>
              <strong>{fieldLabel(calculation.targetFieldId)}</strong> ={' '}
              {calculation.op === 'formula'
                ? calculation.formula
                : `${calculation.op}(${calculation.dependencies.map(fieldLabel).join(', ')})`}
            </div>
            <button
              type="button"
              onClick={() => onChange(calculations.filter((entry) => entry.id !== calculation.id))}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {calculations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No calculations defined yet.</p>
        ) : null}
      </div>
    </div>
  );
}
