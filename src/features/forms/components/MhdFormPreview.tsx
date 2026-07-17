import type { MhdFormDefinition } from '../Types';
import { MhdFormRenderer } from './MhdFormRenderer';

interface MhdFormPreviewProps {
  form: {
    id: string;
    name: string;
    description?: string;
    definition: MhdFormDefinition;
  };
}

export function MhdFormPreview({ form }: MhdFormPreviewProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <MhdFormRenderer
        formId={form.id}
        previewDefinition={form.definition}
        previewName={form.name}
        previewDescription={form.description}
      />
    </div>
  );
}
