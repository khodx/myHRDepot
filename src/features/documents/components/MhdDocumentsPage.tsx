import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTaskWorkspaceNav } from '@/appshell/components/MhdTaskWorkspaceNav';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateDocumentTemplates, mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { useMhdCompanies } from '@/features/companies/Hook';
import {
  useMhdDocumentTemplate,
  useMhdDocumentTemplateActions,
  useMhdDocumentTemplates,
} from '../Hook';
import { useMhdForkDocumentTemplate, useMhdSetDocumentTemplateWizardSettings } from '../OutputHook';
import { mhdDocumentOutputService, mhdDocumentService } from '../Service';
import { MHD_DOCUMENT_TEMPLATE_TYPES } from '../Types';
import type { MhdDocumentTemplateVersion } from '../Types';
import { MhdDocumentTemplateEditor } from './MhdDocumentTemplateEditor';
import { MhdDocumentTemplateList } from './MhdDocumentTemplateList';
import { MhdDocumentTemplateVersionsModal } from './MhdDocumentTemplateVersionsModal';

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
  const isPlatformAdmin = mhdIsPlatformAdmin(roles);
  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );

  const [templateTypeFilter, setTemplateTypeFilter] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [historyTemplateId, setHistoryTemplateId] = useState<string | null>(null);
  const [historyTemplateName, setHistoryTemplateName] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = companiesQuery.data ?? [];
  const templatesQuery = useMhdDocumentTemplates(
    profile?.companyId ?? null,
    templateTypeFilter || undefined,
    true,
  );
  const selectedTemplateQuery = useMhdDocumentTemplate(editingTemplateId);
  const actions = useMhdDocumentTemplateActions(actorContext);
  const forkTemplate = useMhdForkDocumentTemplate();
  const setWizardSettings = useMhdSetDocumentTemplateWizardSettings(historyTemplateId ?? '');
  const canCustomize = canMutate && Boolean(profile?.companyId);

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

  async function handleCustomize(templateId: string) {
    if (!profile?.companyId) return;
    setActionError(null);
    setInfoMessage(null);
    try {
      const result = await forkTemplate.mutateAsync({ templateId, companyId: profile.companyId });
      openEdit(result.id);
      if (result.alreadyExisted)
        setInfoMessage('Your company already has its own copy — opened it for editing.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to customize template.');
    }
  }

  async function handleRestore(version: MhdDocumentTemplateVersion) {
    if (!historyTemplateId) return;
    setActionError(null);
    setIsRestoring(true);
    try {
      const detail = await mhdDocumentService.getTemplate(historyTemplateId);
      await actions.updateTemplate.mutateAsync({
        templateId: detail.id,
        companyId: detail.companyId,
        name: version.name,
        templateType: detail.templateType,
        applicableEntityType: detail.applicableEntityType,
        description: detail.description,
        contentFormat: version.contentFormat as typeof detail.contentFormat,
        content: version.content,
        mergeFields: version.mergeFields,
        requiresSignature: version.requiresSignature,
        isActive: detail.isActive,
      });
      // The filing category is not part of a version, so keep whatever the template has now.
      // Read it fresh: a settings query that had not loaded yet would otherwise clear it.
      const currentSettings =
        await mhdDocumentOutputService.getTemplateWizardSettings(historyTemplateId);
      await setWizardSettings.mutateAsync({
        employeeFileCategory: currentSettings.employeeFileCategory,
        narrativeSlots: version.narrativeSlots,
      });
      setHistoryTemplateId(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to restore template version.',
      );
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <MhdTaskWorkspaceNav />

      <MhdPageHeader
        title="Reports"
        description="Report templates and generation, shared across every module — the same library any task, case, or record can generate a report from."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/reports/queue"
              className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
            >
              Documents To Generate
            </Link>
            <Link
              to="/reports/letterhead"
              className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
            >
              Letterhead
            </Link>
            {canMutate ? (
              <Button onClick={openCreate} className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            ) : null}
          </div>
        }
      />

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
      {infoMessage ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {infoMessage}
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
          canEdit={canMutate}
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
              canCustomize={canCustomize}
              onCustomize={(templateId) => void handleCustomize(templateId)}
              onHistory={(templateId) => {
                const template = (templatesQuery.data ?? []).find((item) => item.id === templateId);
                setHistoryTemplateName(template?.name ?? 'Template');
                setHistoryTemplateId(templateId);
              }}
            />
          )}
        </div>
      </MhdCard>
      {historyTemplateId ? (
        <MhdDocumentTemplateVersionsModal
          templateId={historyTemplateId}
          templateName={historyTemplateName}
          canRestore={canMutate}
          isRestoring={isRestoring}
          onRestore={handleRestore}
          onClose={() => setHistoryTemplateId(null)}
        />
      ) : null}
    </div>
  );
}
