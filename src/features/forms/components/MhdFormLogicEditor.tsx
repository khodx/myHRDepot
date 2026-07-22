import { useState } from 'react';
import type { MhdFormField, MhdFormLogicRule } from '../Types';

interface MhdFormLogicEditorProps {
  fields: MhdFormField[];
  rules: MhdFormLogicRule[];
  onChange: (rules: MhdFormLogicRule[]) => void;
}

const MHD_LOGIC_OPERATORS = [
  { value: 'equals', label: 'is equal to' },
  { value: 'notEquals', label: 'is not equal to' },
  { value: 'contains', label: 'contains' },
  { value: 'greaterThan', label: 'is greater than' },
  { value: 'lessThan', label: 'is less than' },
  { value: 'greaterOrEqual', label: 'is at least' },
  { value: 'lessOrEqual', label: 'is at most' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
] as const;

export function MhdFormLogicEditor({ fields, rules, onChange }: MhdFormLogicEditorProps) {
  const [draftFieldId, setDraftFieldId] = useState(fields[0]?.id ?? '');
  const [draftOperator, setDraftOperator] = useState<(typeof MHD_LOGIC_OPERATORS)[number]['value']>('equals');
  const [draftValue, setDraftValue] = useState('');
  const [draftAction, setDraftAction] = useState<MhdFormLogicRule['action']>('SHOW');
  const [draftTargetFieldId, setDraftTargetFieldId] = useState(fields[1]?.id ?? fields[0]?.id ?? '');

  const fieldLabel = (fieldId: string) => fields.find((field) => field.id === fieldId)?.label ?? fieldId;

  const handleAddRule = () => {
    if (!draftFieldId || !draftTargetFieldId) return;

    onChange([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        order: rules.length + 1,
        condition: {
          field: draftFieldId,
          operator: draftOperator,
          value: draftOperator === 'isEmpty' || draftOperator === 'isNotEmpty' ? undefined : draftValue,
        },
        action: draftAction,
        targetFieldId: draftTargetFieldId,
      },
    ]);
    setDraftValue('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add Rule</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            value={draftFieldId}
            onChange={(event) => setDraftFieldId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label || field.id}
              </option>
            ))}
          </select>

          <select
            value={draftOperator}
            onChange={(event) => setDraftOperator(event.target.value as (typeof MHD_LOGIC_OPERATORS)[number]['value'])}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {MHD_LOGIC_OPERATORS.map((operator) => (
              <option key={operator.value} value={operator.value}>
                {operator.label}
              </option>
            ))}
          </select>

          {draftOperator === 'isEmpty' || draftOperator === 'isNotEmpty' ? (
            <div />
          ) : (
            <input
              type="text"
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              placeholder="Comparison value"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}

          <select
            value={draftAction}
            onChange={(event) => setDraftAction(event.target.value as MhdFormLogicRule['action'])}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="SHOW">Show</option>
            <option value="HIDE">Hide</option>
            <option value="REQUIRE">Require</option>
            <option value="UNREQUIRE">Un-require</option>
          </select>

          <select
            value={draftTargetFieldId}
            onChange={(event) => setDraftTargetFieldId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label || field.id}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAddRule}
          className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-start justify-between gap-4 rounded-md border border-slate-200 bg-card p-3 text-sm">
            <div>
              If <strong>{fieldLabel((rule.condition as { field?: string }).field ?? '')}</strong>{' '}
              {MHD_LOGIC_OPERATORS.find((operator) => operator.value === (rule.condition as { operator?: string }).operator)?.label ?? 'matches'}{' '}
              {(rule.condition as { value?: string }).value ? <strong>{(rule.condition as { value?: string }).value}</strong> : null},
              then <strong>{rule.action}</strong> <strong>{fieldLabel(rule.targetFieldId)}</strong>
            </div>
            <button
              type="button"
              onClick={() => onChange(rules.filter((entry) => entry.id !== rule.id))}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {rules.length === 0 ? <p className="text-sm text-slate-500">No logic rules defined yet.</p> : null}
      </div>
    </div>
  );
}
