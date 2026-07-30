import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateDocumentTemplates } from '@/appshell/mhdRouteAccess';
import { useMhdCompanies } from '@/features/companies/Hook';
import {
  useMhdDocumentTemplate,
  useMhdDocumentTemplateActions,
  useMhdDocumentTemplates,
} from '../Hook';
import { MHD_DOCUMENT_TEMPLATE_TYPES } from '../Types';
import { MhdDocumentTemplateEditor } from './MhdDocumentTemplateEditor';
import { MhdDocumentTemplateList } from './MhdDocumentTemplateList';

/**
 * The "document library / search UI" the 04.8 Bible spec flags as unbuilt
 * V2 work — a template library any admin can browse and manage. Generation
 * history is per-entity (see MhdDocumentGenerationPanel), embedded by
 * consuming modules like Task's Reports button, not browsed cross-entity
 * here — there is no company-wide generations RPC today, only the
 * polymorphic per-entity one.
 */
export function MhdDocumentsPage() {
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateDocumentTemplates(roles);
  const isPlatformAdmin = roles.includes('Platform Admin');
  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );

  const [templateTypeFilter, setTemplateTypeFilter] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = companiesQuery.data ?? [];
  const templatesQuery = useMhdDocumentTemplates(
    profile?.companyId ?? null,
    templateTypeFilter || undefined,
    true,
  );
  const selectedTemplateQuery = useMhdDocumentTemplate(editingTemplateId);
  const actions = useMhdDocumentTemplateActions(actorContext);

  function openCreate() {
    setEditingTemplateId(null);
    setIsEditorOpen(true);
  }

  function openEdit(templateId: string) {
    setEditingTemplateId(templateId);
    setIsEditorOpen(true);
  }

  async function handleDelete(templateId: string) {
    setActionError(null);
    try {
      await actions.deleteTemplate.mutateAsync(templateId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete template.');
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Reports"
        description="Report templates and generation, shared across every module — the same library any task, case, or record can generate a report from."
        actions={
          canMutate ? (
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          ) : undefined
        }
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {isEditorOpen && canMutate ? (
        <MhdDocumentTemplateEditor
          companies={companies}
          canAuthorPlatformLevel={isPlatformAdmin}
          selectedTemplate={editingTemplateId ? (selectedTemplateQuery.data ?? null) : null}
          isSaving={actions.createTemplate.isPending || actions.updateTemplate.isPending}
          onCreate={async (values) => {
            await actions.createTemplate.mutateAsync(values);
            setIsEditorOpen(false);
          }}
          onUpdate={async (values) => {
            if (!editingTemplateId) return;
            await actions.updateTemplate.mutateAsync({ ...values, templateId: editingTemplateId });
            setIsEditorOpen(false);
          }}
          onCancel={() => setIsEditorOpen(false)}
        />
      ) : null}

      <MhdCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Templates</h2>
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={templateTypeFilter}
            onChange={(event) => setTemplateTypeFilter(event.target.value)}
          >
            <option value="">All types</option>
            {MHD_DOCUMENT_TEMPLATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          {templatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          ) : (
            <MhdDocumentTemplateList
              templates={templatesQuery.data ?? []}
              canMutate={canMutate}
              onEdit={openEdit}
              onDelete={(templateId) => void handleDelete(templateId)}
            />
          )}
        </div>
      </MhdCard>
    </div>
  );
}
