import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdCreateHandbook, useMhdHandbooks } from '../Hook';
import type { MhdCreateHandbookFormValues } from '../Schemas';
import { MhdHandbookCreateForm } from './MhdHandbookCreateForm';
import { MhdHandbookStatusBadge } from './MhdHandbookStatusBadge';
import { MhdHandbookTypeBadge } from './MhdHandbookTypeBadge';

interface Props {
  companyId: string;
  /**
   * Whether this viewer belongs to the privileged set (Platform Admin / HR
   * Partner / Client Admin) that may create and manage handbooks. This page lives
   * at the admin `/handbooks` route and is gated to that set — the RPCs re-check
   * `mhd_handbook_is_privileged` regardless; this only governs the affordances.
   * The employee acknowledgment surface is the separate `/my-handbooks` page.
   */
  canManage: boolean;
  /** Route to the wizard for a handbook (the create flow lands here on success). */
  onOpenHandbook: (handbookId: string) => void;
}

/**
 * `/handbooks` — the admin list of a company's handbooks, by type and status.
 * "New handbook" launches the wizard (create → assemble → publish). A company
 * keeps one live handbook per type at a time; archived ones remain for history.
 */
export function MhdHandbookListPage({ companyId, canManage, onOpenHandbook }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const handbooks = useMhdHandbooks({ companyId });
  const createHandbook = useMhdCreateHandbook();

  async function handleCreate(values: MhdCreateHandbookFormValues) {
    const result = await createHandbook.mutateAsync({
      companyId: values.companyId,
      handbookType: values.handbookType,
      title: values.title,
      jurisdictions: values.jurisdictions,
    });
    setIsCreating(false);
    onOpenHandbook(result.id);
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Handbooks"
        description="Employee and Safety handbooks for this company. Publishing freezes an immutable, hashed version an employee acknowledges."
        actions={
          canManage ? <Button onClick={() => setIsCreating(true)}>New handbook</Button> : undefined
        }
      />

      {handbooks.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (handbooks.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No handbooks yet.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Title</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Effective</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(handbooks.data ?? []).map((handbook) => (
                <MhdTr key={handbook.id} to={`/handbooks/${handbook.id}`}>
                  <MhdTd className="whitespace-nowrap font-mono text-xs">
                    {handbook.referenceId}
                  </MhdTd>
                  <MhdTd className="font-medium">{handbook.title}</MhdTd>
                  <MhdTd>
                    <MhdHandbookTypeBadge handbookType={handbook.handbookType} />
                  </MhdTd>
                  <MhdTd>
                    <MhdHandbookStatusBadge status={handbook.status} />
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {handbook.effectiveDate ?? '—'}
                  </MhdTd>
                  <MhdTd className="text-right">
                    <button
                      type="button"
                      onClick={() => onOpenHandbook(handbook.id)}
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Open
                    </button>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {isCreating && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">New handbook</h2>
            <MhdHandbookCreateForm
              companyId={companyId}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isSubmitting={createHandbook.isPending}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
