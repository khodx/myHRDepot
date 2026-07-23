import type { MhdFormField } from '../Types';
import { MhdFormFieldConfig } from './MhdFormFieldConfig';

interface MhdFormPropertyPanelProps {
  selectedField: MhdFormField | null;
  onChange: (next: MhdFormField) => void;
  onDeleteField: (fieldId: string) => void;
}

export function MhdFormPropertyPanel({ selectedField, onChange, onDeleteField }: MhdFormPropertyPanelProps) {
  if (!selectedField) {
    return (
      <aside className="w-80 border-l border-border bg-card p-4 text-sm text-muted-foreground">
        Select a field on the canvas to edit its properties.
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Field Properties</h4>
        <button
          type="button"
          onClick={() => onDeleteField(selectedField.id)}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>

      <MhdFormFieldConfig field={selectedField} onChange={onChange} />
    </aside>
  );
}
