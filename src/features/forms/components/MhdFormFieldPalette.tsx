import { MHD_FORM_PALETTE_FIELD_TYPES, type MhdFieldType } from '../Types';

interface MhdFormFieldPaletteProps {
  onAddField: (type: MhdFieldType) => void;
}

export function MhdFormFieldPalette({ onAddField }: MhdFormFieldPaletteProps) {
  return (
    <aside className="w-64 border-r border-border bg-muted p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Field Palette</h3>
      <p className="mt-1 text-sm text-muted-foreground">Click a field type to add it to the current form.</p>

      <div className="mt-4 grid gap-2">
        {MHD_FORM_PALETTE_FIELD_TYPES.map((fieldType) => (
          <button
            key={fieldType.type}
            type="button"
            onClick={() => onAddField(fieldType.type)}
            className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium text-slate-700 hover:border-accent hover:bg-accent-tint"
          >
            {fieldType.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
