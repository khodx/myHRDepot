import { MHD_FORM_PALETTE_FIELD_GROUPS, type MhdFieldType } from '../Types';

interface MhdFormFieldPaletteProps {
  onAddField: (type: MhdFieldType) => void;
}

export function MhdFormFieldPalette({ onAddField }: MhdFormFieldPaletteProps) {
  return (
    <aside className="w-64 border-r border-border bg-muted p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Field Palette
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Click a field type to add it to the current form.
      </p>

      <div className="mt-4 space-y-5">
        {MHD_FORM_PALETTE_FIELD_GROUPS.map((group) => (
          <section key={group.group}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.group}
            </h4>
            <div className="grid gap-2">
              {group.fields.map((fieldType) => (
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
          </section>
        ))}
      </div>
    </aside>
  );
}
