import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateScheduleTemplate,
  useMhdScheduleTemplate,
  useMhdUpdateScheduleTemplate,
} from '../Hook';
import type { MhdScheduleTemplateFormValues } from '../Schemas';
import { MhdScheduleTemplateForm } from './MhdScheduleTemplateForm';

export type MhdScheduleTemplatePageMode = 'create' | 'view' | 'edit';

interface Props {
  mode: MhdScheduleTemplatePageMode;
}

/**
 * One page component for the three pattern lifecycle routes, so New, View and Edit
 * render the same form and cannot drift:
 *
 * - `/schedule/templates/new`            create
 * - `/schedule/templates/:templateId`      view (read-only)
 * - `/schedule/templates/:templateId/edit` edit
 */
export function MhdScheduleTemplatePage({ mode }: Props) {
  const navigate = useNavigate();
  const { templateId = null } = useParams<{ templateId: string }>();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;

  const template = useMhdScheduleTemplate(mode === 'create' ? null : templateId);
  const createTemplate = useMhdCreateScheduleTemplate(companyId);
  const updateTemplate = useMhdUpdateScheduleTemplate(companyId);
  const [error, setError] = useState<string | null>(null);

  if (!companyId) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  async function handleSubmit(values: MhdScheduleTemplateFormValues, isActive: boolean) {
    setError(null);
    try {
      if (mode === 'create') {
        const created = await createTemplate.mutateAsync({
          companyId: values.companyId,
          templateName: values.templateName,
          description: values.description ?? null,
          days: values.days,
        });
        navigate(`/schedule/templates/${created.id}`);
      } else if (templateId) {
        await updateTemplate.mutateAsync({
          templateId,
          templateName: values.templateName,
          description: values.description ?? '',
          isActive,
          days: values.days,
        });
        navigate(`/schedule/templates/${templateId}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the pattern.');
    }
  }

  const title =
    mode === 'create'
      ? 'New Schedule Pattern'
      : (template.data?.templateName ?? 'Schedule Pattern');

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/schedule/templates"
        backLabel="Schedule Patterns"
        title={title}
        description={
          mode === 'create'
            ? 'Define a weekly work pattern. Assign it to employees afterwards to generate shifts.'
            : template.data?.referenceId
        }
        actions={
          mode === 'view' && templateId ? (
            <Button onClick={() => navigate(`/schedule/templates/${templateId}/edit`)}>Edit</Button>
          ) : undefined
        }
      />

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {mode !== 'create' && template.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading pattern…</p>
      ) : mode !== 'create' && !template.data ? (
        <p className="text-sm text-muted-foreground">This pattern could not be found.</p>
      ) : (
        <MhdScheduleTemplateForm
          // Remount when the loaded pattern changes so defaults reflect it.
          key={template.data?.id ?? 'new'}
          companyId={companyId}
          template={template.data ?? null}
          readOnly={mode === 'view'}
          showActiveToggle={mode !== 'create'}
          isSubmitting={createTemplate.isPending || updateTemplate.isPending}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(
              mode === 'edit' && templateId
                ? `/schedule/templates/${templateId}`
                : '/schedule/templates',
            )
          }
        />
      )}
    </div>
  );
}
