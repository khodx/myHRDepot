import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdRowActionsMenu } from '@/components/ui/MhdRowActionsMenu';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDeleteScheduleTemplate, useMhdScheduleTemplates } from '../Hook';
import type { MhdScheduleTemplateSummary } from '../Types';

/**
 * `/schedule/templates` - the weekly work patterns a company assigns to employees.
 *
 * Privileged only (route guard); the RPCs refuse anyone else regardless. Delete is
 * offered for every row but the server only permits it for a pattern nobody has ever
 * been assigned, so an assigned pattern's Delete explains why instead of failing
 * silently - deactivate it from Edit to retire it.
 */
export function MhdScheduleTemplatesPage() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;

  const templates = useMhdScheduleTemplates(companyId);
  const deleteTemplate = useMhdDeleteScheduleTemplate(companyId);
  const [deleteTarget, setDeleteTarget] = useState<MhdScheduleTemplateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the pattern.');
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/schedule"
        backLabel="Schedule"
        title="Schedule Patterns"
        description="Weekly work patterns that are assigned to employees to generate shifts."
        actions={<Button onClick={() => navigate('/schedule/templates/new')}>New Pattern</Button>}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {templates.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading patterns…</p>
      ) : (templates.data ?? []).length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={CalendarRange}
            title="No schedule patterns yet."
            description="Create a weekly pattern, then assign it to an employee to generate their shifts."
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Name</MhdTh>
                <MhdTh className="text-right">Weekly hours</MhdTh>
                <MhdTh className="text-right">Working days</MhdTh>
                <MhdTh className="text-right">Assigned</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(templates.data ?? []).map((template) => (
                <MhdTr key={template.id} to={`/schedule/templates/${template.id}`}>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {template.referenceId}
                  </MhdTd>
                  <MhdTd className="font-medium">{template.templateName}</MhdTd>
                  <MhdTd className="text-right tabular-nums">{template.totalWeeklyHours}</MhdTd>
                  <MhdTd className="text-right tabular-nums">{template.workingDays}</MhdTd>
                  <MhdTd className="text-right tabular-nums">{template.assignedCount}</MhdTd>
                  <MhdTd>
                    <MhdBadge variant={template.isActive ? 'success' : 'neutral'} hideIcon>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </MhdBadge>
                  </MhdTd>
                  <MhdTd className="text-right">
                    <MhdRowActionsMenu
                      triggerLabel={`Actions for ${template.templateName}`}
                      actions={[
                        {
                          key: 'view',
                          label: 'View',
                          onSelect: () => navigate(`/schedule/templates/${template.id}`),
                        },
                        {
                          key: 'edit',
                          label: 'Edit',
                          onSelect: () => navigate(`/schedule/templates/${template.id}/edit`),
                        },
                        {
                          key: 'delete',
                          label: 'Delete',
                          destructive: true,
                          onSelect: () => {
                            setError(null);
                            setDeleteTarget(template);
                          },
                        },
                      ]}
                    />
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {deleteTarget ? (
        <MhdModal
          title="Delete Pattern"
          onClose={() => setDeleteTarget(null)}
          className="relative flex w-full max-w-md flex-col rounded-lg border border-border bg-background shadow-xl"
        >
          <h2 className="text-base font-semibold text-foreground">Delete Pattern</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Delete <span className="font-medium text-foreground">{deleteTarget.templateName}</span>?
            {deleteTarget.assignedCount > 0
              ? ' This pattern has been assigned to employees, so it cannot be deleted - mark it inactive from Edit to retire it instead.'
              : ' This cannot be undone.'}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="px-3 py-1.5"
              disabled={deleteTemplate.isPending || deleteTarget.assignedCount > 0}
              onClick={() => void confirmDelete()}
            >
              {deleteTemplate.isPending ? 'Deleting…' : 'Delete Pattern'}
            </Button>
          </div>
        </MhdModal>
      ) : null}
    </div>
  );
}
