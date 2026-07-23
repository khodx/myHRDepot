import { MhdCard } from '@/components/ui/MhdCard';
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
    <MhdCard className="overflow-hidden p-0">
      <MhdFormRenderer
        formId={form.id}
        previewDefinition={form.definition}
        previewName={form.name}
        previewDescription={form.description}
      />
    </MhdCard>
  );
}
