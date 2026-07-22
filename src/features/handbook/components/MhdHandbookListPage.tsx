import { useState } from 'react';
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
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Handbooks</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Employee and Safety handbooks for this company. Publishing freezes an immutable, hashed
            version an employee acknowledges.
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50"
          >
            New handbook
          </button>
        ) : null}
      </header>

      {handbooks.isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (handbooks.data ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">No handbooks yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Reference</th>
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Effective</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(handbooks.data ?? []).map((handbook) => (
                <tr key={handbook.id} className="border-b border-neutral-100 text-neutral-800">
                  <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs">
                    {handbook.referenceId}
                  </td>
                  <td className="py-2 pr-4 font-medium text-neutral-900">{handbook.title}</td>
                  <td className="py-2 pr-4">
                    <MhdHandbookTypeBadge handbookType={handbook.handbookType} />
                  </td>
                  <td className="py-2 pr-4">
                    <MhdHandbookStatusBadge status={handbook.status} />
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-neutral-600">
                    {handbook.effectiveDate ?? '—'}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenHandbook(handbook.id)}
                      className="text-sm text-neutral-500 underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">New handbook</h2>
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
