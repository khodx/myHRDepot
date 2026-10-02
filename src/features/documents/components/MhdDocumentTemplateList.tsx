import type { MhdDocumentTemplate } from '../Types';

interface MhdDocumentTemplateListProps {
  templates: MhdDocumentTemplate[];
  canMutate: boolean;
  onEdit: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  canCustomize?: boolean;
  onCustomize?: (templateId: string) => void;
  onHistory?: (templateId: string) => void;
}

export function MhdDocumentTemplateList({
  templates,
  canMutate,
  onEdit,
  onDelete,
  canCustomize,
  onCustomize,
  onHistory,
}: MhdDocumentTemplateListProps) {
  if (templates.length === 0) {
    return <p className="text-sm text-muted-foreground">No document templates yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {templates.map((template) => (
        <li key={template.id} className="flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
            <p className="text-xs text-muted-foreground">
              {template.referenceId} · {template.templateType} · v{template.version}
              {template.applicableEntityType
                ? ` · ${template.applicableEntityType}`
                : ' · Unassigned'}
              {template.companyId === null ? ' · Platform-level' : ''}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
              template.isActive
                ? 'border-green-200 bg-green-100 text-green-700'
                : 'border-neutral-200 bg-neutral-100 text-neutral-500'
            }`}
          >
            {template.isActive ? 'Active' : 'Inactive'}
          </span>
          {canCustomize && onCustomize && template.companyId === null ? (
            <button
              type="button"
              onClick={() => onCustomize(template.id)}
              className="text-xs font-medium text-accent-hover hover:underline"
            >
              Customize For My Company
            </button>
          ) : null}
          {canMutate ? (
            <div className="flex shrink-0 items-center gap-2">
              {onHistory ? (
                <button
                  type="button"
                  onClick={() => onHistory(template.id)}
                  className="text-xs font-medium text-accent-hover hover:underline"
                >
                  Version History
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onEdit(template.id)}
                className="text-xs font-medium text-accent-hover hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(`Delete template "${template.name}"? This cannot be undone.`)
                  ) {
                    onDelete(template.id);
                  }
                }}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ) : onHistory ? (
            <button
              type="button"
              onClick={() => onHistory(template.id)}
              className="text-xs font-medium text-accent-hover hover:underline"
            >
              Version History
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
